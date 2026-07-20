'use client'

// The Ten Project newsletter — email-styled, fully branded preview that opens
// in a new tab with Print/Save-as-PDF. This is what replaces the Mailchimp
// sends: same look for every family, but scoped per venue and tracked per
// household in production.

import { openDocWindow, esc } from './funder-docs'

const RED = '#D7262C'
const DARK = '#111114'

export interface NewsletterContent {
  subject: string
  preheader: string
  heroKicker: string
  heroTitle: string
  intro: string
  sessionCard: { title: string; lines: string[]; cta: string }
  sections: { title: string; body: string }[]
  fundraising?: { school: string; raised: number; target: number; line: string }
  signoff: string
}

export const NEWSLETTER_SEPTEMBER: NewsletterContent = {
  subject: 'WE’RE BACK! Your September sessions — venues, dates & a big year ahead 🎾',
  preheader: 'Free family tennis returns — find your venue and save your Saturdays.',
  heroKicker: 'SEPTEMBER RESTART',
  heroTitle: 'WE’RE BACK — AND SO ARE YOUR SATURDAYS',
  intro: 'The school holidays are nearly done, the courts are calling, and our Free Community Family Sessions are back from the first weekend of September. Everything you need is below — your venue, your time, and one tap to tell us you’re coming.',
  sessionCard: {
    title: 'YOUR FAMILY SESSION',
    lines: ['Kingsmead Rec Ground — Saturdays 1.30–2.30pm', 'Back from Saturday 6 September', 'Free · all equipment provided · every family welcome'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'NEW SCHOOLS JOINING THIS TERM', body: 'A warm welcome to Meridian Park Primary, starting their first 10-week programme in September — 45 children get their welcome packs in week one. If you know a school that should be next, tell them about us (or forward this email to the head!).' },
    { title: 'WHAT A SUMMER THAT WAS', body: '2,000+ children a week in school, 950+ family visits to weekend sessions, and 100% of surveyed families said they’d recommend us. Thank you — this programme is you.' },
    { title: '#TENPROJECT — WIN A TRIP TO WIMBLEDON', body: 'Share a photo or clip of your family practising with the tag #tenproject for the chance to win our Wimbledon trip. Only ever shared with your consent — full details in the parent app.' },
  ],
  fundraising: {
    school: 'St Clement’s Primary',
    raised: 2150,
    target: 3200,
    line: 'St Clement’s families are £1,050 from bringing Ten Project back for 2026/27 — and match funding kicks in at £2,560. The Sponsored Ball Hit is 10 October. Every pound counts.',
  },
  signoff: 'See you on court — LEARN. PLAY. TOGETHER.\nHarry & the Ten Project team',
}

export const NEWSLETTER_WEEK4: NewsletterContent = {
  subject: 'Week 4 — BACKHAND week! Your Saturday session details inside 🎾',
  preheader: 'Two hands on the grip, one bounce only — see you Saturday.',
  heroKicker: 'WEEK 4 OF 10',
  heroTitle: 'IT’S BACKHAND WEEK',
  intro: 'This week the children are learning the backhand — favourite hand at the bottom of the grip, swing low to high. Ask them to show you, then come and try it together this weekend.',
  sessionCard: {
    title: 'YOUR FAMILY SESSION',
    lines: ['Kingsmead Rec Ground — this Saturday 1.30–2.30pm', 'Scan the QR at the gate to check in', 'Free · all equipment provided'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'WATCH THE BACKHAND VIDEO', body: 'Two minutes forty of everything they’re learning this week — take it to your court, try it at home, but most of all try it as a family.' },
    { title: 'STICKER WATCH', body: 'The Shots stickers are landing in booklets this week. When one comes home, that’s your cue: “show me!”' },
  ],
  signoff: 'See you Saturday — LEARN. PLAY. TOGETHER.\nHarry & the Ten Project team',
}

export function newsletterHtml(n: NewsletterContent): string {
  const pct = n.fundraising ? Math.min(100, Math.round((n.fundraising.raised / n.fundraising.target) * 100)) : 0
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(n.subject)}</title>
<link rel="icon" href="/tenproject-favicon-32.png">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #EDEAE5; padding: 0; }
  .toolbar { position: sticky; top: 0; background: ${DARK}; padding: 10px 18px; display: flex; justify-content: space-between; align-items: center; }
  .toolbar span { color: #C9C4BE; font-size: 12px; font-weight: 600; }
  .toolbar button { background: ${RED}; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 800; cursor: pointer; }
  .meta { max-width: 620px; margin: 18px auto 0; background: #fff; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #5B554F; border: 1px solid #E7E2DC; }
  .meta b { color: #1B1B21; }
  .email { max-width: 620px; margin: 12px auto 40px; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 34px #00000018; }
  .hd { background: ${DARK}; padding: 26px 30px; text-align: center; }
  .hd img { height: 40px; }
  .hero { background: ${RED}; color: #fff; padding: 26px 30px; text-align: center; }
  .hero .k { font-size: 11px; font-weight: 800; letter-spacing: 2.5px; opacity: .9; }
  .hero h1 { font-size: 27px; font-weight: 900; margin-top: 8px; line-height: 1.15; }
  .body { padding: 26px 30px; }
  .body p { font-size: 14px; color: #33302C; line-height: 1.65; }
  .card { background: #F7F5F2; border: 2px solid ${RED}; border-radius: 12px; padding: 18px 20px; margin: 20px 0; text-align: center; }
  .card .t { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: ${RED}; }
  .card .l { font-size: 14px; font-weight: 700; color: #1B1B21; margin-top: 7px; line-height: 1.6; }
  .card a { display: inline-block; margin-top: 12px; background: ${RED}; color: #fff; border-radius: 9px; padding: 12px 22px; font-size: 14px; font-weight: 800; text-decoration: none; }
  h2 { font-size: 13px; font-weight: 900; letter-spacing: 1.5px; color: ${RED}; margin: 22px 0 8px; }
  .fund { background: ${DARK}; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #fff; }
  .fund .t { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: ${RED}; }
  .fund p { color: #C9C4BE; font-size: 13px; margin-top: 7px; }
  .bar { background: #33333B; border-radius: 999px; height: 14px; margin-top: 12px; overflow: hidden; position: relative; }
  .bar > div { height: 100%; width: ${pct}%; background: linear-gradient(90deg, ${RED}, #F0524F); border-radius: 999px; }
  .bar span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #fff; }
  .sign { white-space: pre-line; font-weight: 700; color: #1B1B21; margin-top: 22px; font-size: 14px; }
  .ft { background: #F7F5F2; border-top: 1px solid #E7E2DC; padding: 18px 30px; font-size: 10.5px; color: #8A847E; text-align: center; line-height: 1.7; }
  .ft a { color: ${RED}; font-weight: 700; text-decoration: none; }
  @media print { .toolbar, .meta { display: none; } body { background: #fff; } .email { box-shadow: none; margin: 0; } }
</style></head>
<body>
<div class="toolbar"><span>Newsletter preview — exactly what families receive</span><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="meta"><b>Subject:</b> ${esc(n.subject)}<br><b>Preheader:</b> ${esc(n.preheader)} · <b>Audience:</b> scoped per venue — each family sees THEIR session only</div>
<div class="email">
  <div class="hd"><img src="/tenproject_logo_dark.png" alt="Ten Project"></div>
  <div class="hero"><div class="k">${esc(n.heroKicker)}</div><h1>${esc(n.heroTitle)}</h1></div>
  <div class="body">
    <p>Hi Sarah,</p>
    <p style="margin-top:10px">${esc(n.intro)}</p>
    <div class="card">
      <div class="t">${esc(n.sessionCard.title)}</div>
      <div class="l">${n.sessionCard.lines.map(l => esc(l)).join('<br>')}</div>
      <a href="#">${esc(n.sessionCard.cta)}</a>
    </div>
    ${n.sections.map(s => `<h2>${esc(s.title)}</h2><p>${esc(s.body)}</p>`).join('')}
    ${n.fundraising ? `
    <div class="fund">
      <div class="t">SUPPORT ${esc(n.fundraising.school.toUpperCase())}</div>
      <p>${esc(n.fundraising.line)}</p>
      <div class="bar"><div></div><span>£${n.fundraising.raised.toLocaleString()} of £${n.fundraising.target.toLocaleString()}</span></div>
    </div>` : ''}
    <div class="sign">${esc(n.signoff)}</div>
  </div>
  <div class="ft">
    Ten Project Ltd · 7 Cranmer Close, Morden, London SM4 4SU<br>
    You’re receiving this because your family is registered with Ten Project.<br>
    <a href="#">Update preferences</a> · <a href="#">Unsubscribe</a> — LEARN. PLAY. TOGETHER.
  </div>
</div>
</body></html>`
}

export function openNewsletter(n: NewsletterContent) {
  openDocWindow(newsletterHtml(n))
}
