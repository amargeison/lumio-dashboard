'use client'

// The programme newsletter — email-styled, fully branded preview that opens
// in a new tab with Print/Save-as-PDF. This is what replaces the Mailchimp
// sends: same look for every family, but scoped per venue and tracked per
// household in production.

import { openDocWindow, esc } from './funder-docs'
import type { ImpactCopy, ImpactPortalContext } from '../_components/ImpactDataContext'

const RED = '#D7262C'
const DARK = '#111114'

// Newsletter content now lives with each dataset's copy (portal-copy.ts /
// src/data/impact/*), so the same template renders any programme's sends.
export type NewsletterContent = ImpactCopy['newsletters']['september']

export function newsletterHtml(n: NewsletterContent, ctx: ImpactPortalContext): string {
  const b = ctx.brand
  const firstName = ctx.data.PARENT.name.split(' ')[0]
  const pct = n.fundraising && n.fundraising.target > 0 ? Math.min(100, Math.round((n.fundraising.raised / n.fundraising.target) * 100)) : 0
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(n.subject)}</title>
<link rel="icon" href="${b.favicon32}">
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
  <div class="hd"><img src="${b.logoDark}" alt="${esc(b.logoAlt)}"></div>
  <div class="hero"><div class="k">${esc(n.heroKicker)}</div><h1>${esc(n.heroTitle)}</h1></div>
  <div class="body">
    <p>Hi ${esc(firstName)},</p>
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
    ${esc(b.legal)} · ${esc(b.address)}<br>
    You’re receiving this because your family is registered with ${esc(b.org)}.<br>
    <a href="#">Update preferences</a> · <a href="#">Unsubscribe</a> — ${esc(b.tagline)}
  </div>
</div>
</body></html>`
}

export function openNewsletter(n: NewsletterContent, ctx: ImpactPortalContext) {
  openDocWindow(newsletterHtml(n, ctx))
}
