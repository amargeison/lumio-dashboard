// The three starter guides, linked from every email that welcomes a coach.
//
// They live in /public/guides so the links are plain downloads that work in any
// mail client — no sign-in, no expiring link. Update a PDF there and every email
// already sent points at the new version.

const BASE = 'https://www.lumiosports.com/guides'

export const COACH_GUIDES = [
  { title: 'Quick start guide', blurb: 'Two pages: your first 30 minutes, step by step.', url: `${BASE}/lumio-quick-start-guide.pdf` },
  { title: 'Getting started guide', blurb: 'Setting up your academy, players, team and first camp.', url: `${BASE}/lumio-getting-started-guide.pdf` },
  { title: 'Portal guide', blurb: 'Every page of the portal: what it is for and how to use it.', url: `${BASE}/lumio-portal-guide.pdf` },
]

export function coachGuidesHtml(): string {
  const rows = COACH_GUIDES.map(g => `
<tr><td style="padding:0 0 12px;">
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
    &#128196; <a href="${g.url}" style="color:#ffffff;font-weight:700;text-decoration:underline;">${g.title}</a> (PDF) &mdash; ${g.blurb}
  </p>
</td></tr>`).join('')
  return `
<h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#a855f7;">Your starter guides</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">${rows}
</table>`
}
