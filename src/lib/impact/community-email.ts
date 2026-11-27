// The two emails /join sends, in the org's name (from its verified sender):
//   welcomeEmail   a new family: their QR for check-in (an inline image, cid:family-qr;
//                  left out when the org has QR check-in switched off),
//                  the venue's day and time — or that they're on its waiting list —
//                  and the link to open the family app
//   alreadyEmail   that address is already a family here: the app link again (sign in,
//                  or a new invite link when they have no login yet). Nothing else is
//                  said, and the page's reply is the same as for a new family.

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const button = (href: string, label: string) =>
  `<p><a href="${esc(href)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">${esc(label)}</a></p>`
const wrap = (body: string) => `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;max-width:520px;">${body}</div>`

export interface VenueLine { name: string; session_day?: string | null; session_time?: string | null; address?: string | null; postcode?: string | null }
export const venueWhen = (v: VenueLine) => [v.session_day, v.session_time].filter(Boolean).join(' ') || null
export const venueWhere = (v: VenueLine) => [v.address, v.postcode].filter(Boolean).join(', ') || null

export function welcomeEmail(o: { org: string; guardian: string; children: string[]; venue: VenueLine; waitlisted: boolean; appLink: string | null; qrCid: string | null }) {
  const first = o.guardian.split(' ')[0]
  const when = venueWhen(o.venue), where = venueWhere(o.venue)
  const kids = o.children.length > 1 ? `${o.children.slice(0, -1).join(', ')} and ${o.children[o.children.length - 1]}` : o.children[0]
  const place = o.waitlisted
    ? `<p><b>${esc(o.venue.name)} is full at the moment</b>, so you’re on its waiting list. We’ll message you as soon as there’s a place for ${esc(kids)}.</p>`
    : `<p>We look forward to seeing ${esc(kids)} at <b>${esc(o.venue.name)}</b>${when ? `, <b>${esc(when)}</b>` : ''}.${where ? ` It’s at ${esc(where)}.` : ''}</p>`
  const html = wrap(
    `<p>Hi ${esc(first)},</p>`
    + `<p>Thanks for joining ${esc(o.org)}’s weekend sessions.</p>`
    + place
    + (o.qrCid ? `<p><b>Your family QR code</b> — show it when you arrive and we’ll check everyone in:</p>`
      + `<p><img src="cid:${esc(o.qrCid)}" alt="Your family check-in code" width="180" height="180" style="display:block;border:0;"></p>` : '')
    + (o.appLink ? `<p>${o.qrCid ? 'You can also see it, and tell us' : 'Tell us'} if you’re coming each week in the family app:</p>${button(o.appLink, 'Open the family app')}`
      + `<p style="color:#6b7280;font-size:12px;">The app link works once, for this email address, and lasts 7 days. We’ll email you a 6-digit code to sign in.</p>` : '')
    + `<p style="color:#6b7280;font-size:12px;">You’re getting this because this address was used to join ${esc(o.org)}’s weekend sessions. If that wasn’t you, reply and we’ll delete the details.</p>`,
  )
  return { subject: o.waitlisted ? `You’re on the waiting list — ${o.org}` : `Welcome to ${o.org}’s weekend sessions`, html }
}

export function alreadyEmail(o: { org: string; link: string; isInvite: boolean }) {
  const html = wrap(
    `<p>Someone (we hope you) tried to join ${esc(o.org)}’s weekend sessions with this email address — but you’re already with us.</p>`
    + (o.isInvite ? `<p>Here’s a link to open the family app:</p>${button(o.link, 'Open the family app')}<p style="color:#6b7280;font-size:12px;">It works once, for this email address, and lasts 7 days.</p>`
      : `<p>Sign in to the family app here:</p>${button(o.link, 'Sign in')}`)
    + `<p style="color:#6b7280;font-size:12px;">If that wasn’t you, you can ignore this email — nothing has changed.</p>`,
  )
  return { subject: `You’re already with ${o.org}`, html }
}
