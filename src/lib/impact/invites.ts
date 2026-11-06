// Invite tokens and the invite email. Server only: the token is hashed here and the
// hash is all the database ever holds.

import { createHash, randomBytes } from 'node:crypto'

export type InviteRole = 'coach' | 'parent'

export const INVITE_HOURLY_LIMIT = 50

export const newInviteToken = () => randomBytes(32).toString('base64url')
export const hashInviteToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** One link: the sign-in page, with the address filled in and the token to exchange. */
export const inviteLink = (site: string, email: string, token: string) =>
  `${site}/sports-login?email=${encodeURIComponent(email)}&invite=${encodeURIComponent(token)}`

/** How many more invites this org may send in the current hour. */
export const invitesLeft = (sentThisHour: number) => Math.max(0, INVITE_HOURLY_LIMIT - sentThisHour)

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function inviteEmail(o: { org: string; role: InviteRole; link: string }) {
  const org = escapeHtml(o.org)
  const what = o.role === 'parent'
    ? 'your family’s sessions, progress and messages'
    : 'your sessions and registers'
  return {
    subject: `Your ${o.org} login`,
    html:
      `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;">`
      + `<p>${org} has set up a login for you, so you can see ${what}.</p>`
      + `<p><a href="${escapeHtml(o.link)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Open your login</a></p>`
      + `<p style="color:#6b7280;font-size:12px;">This link works once, for this email address, and lasts 7 days. We’ll email you a 6-digit code to sign in. If you weren’t expecting this, you can ignore it.</p>`
      + `</div>`,
  }
}
