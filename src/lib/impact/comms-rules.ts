// Consent rules for Lumio Impact messages. Pure functions with no I/O, so the
// rules the send route depends on can be read and tested in one place.
//
// Unknown is never yes: consent columns are null until recorded, and only an
// explicit true passes.

import { createHmac, timingSafeEqual } from 'node:crypto'

import type { ConsentChild, ConsentFamily } from './comms-consent'
export { contactBlock, toE164, type CommsChannel, type ConsentFamily, type ConsentChild } from './comms-consent'

// What an app message's result says. Until FAMILY_APP_LIVE=on families can't sign
// in, and a family with no accepted parent login can't either, so in both cases the
// message waits unread and the result must not read as delivered.
export const familyAppLive = () => process.env.FAMILY_APP_LIVE === 'on'
export const appFiledDetail = (hasLogin: boolean) =>
  !familyAppLive() ? 'Saved for the family app, which families can’t open yet'
  : hasLogin ? 'In the family app'
  : 'Saved for the family app — no login yet'

/** Green needs both the household's consent and the child's own. */
export function photoGreen(family: ConsentFamily | undefined, child: ConsentChild): boolean {
  return family?.consent_photo === true && child.photo_consent === true
}

function mentions(text: string, name: string): boolean {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return false
  const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
  return new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'iu').test(text)
}

/**
 * The first child without green consent that this message names, for this
 * recipient. Full names are checked across the whole org. First names are
 * checked only against the recipient's own children: across a whole org they
 * would stop ordinary sentences ("Will you be there?").
 */
export function namedWithoutConsent(
  text: string,
  recipient: ConsentFamily,
  families: Map<string, ConsentFamily>,
  children: ConsentChild[],
): string | null {
  for (const c of children) {
    const family = c.family_id ? families.get(c.family_id) : undefined
    if (photoGreen(family, c)) continue
    if (mentions(text, c.name)) return c.name.trim()
    if (c.family_id === recipient.id) {
      const first = c.name.trim().split(/\s+/)[0] ?? ''
      if (first.length > 1 && mentions(text, first)) return c.name.trim()
    }
  }
  return null
}

/**
 * The address an org may send from, set by Lumio in IMPACT_EMAIL_SENDERS, e.g.
 * {"ten-project":"hello@tenproject.org.uk"}. It is deliberately not read from
 * impact_orgs.settings: an HQ can edit those from the browser, and Resend would
 * accept any domain on Lumio's account, including Lumio's own.
 */
export function verifiedSender(slug: string, config: string | undefined): string | null {
  try {
    const address = (JSON.parse(config || '{}') as Record<string, unknown>)[slug]
    return typeof address === 'string' && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(address) ? address : null
  } catch {
    return null
  }
}

const UNSUBSCRIBE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const unsubscribeSig = (familyId: string, secret: string) =>
  createHmac('sha256', secret).update(`impact-unsubscribe:${familyId.toLowerCase()}`).digest('base64url')

/** A signed token that can unsubscribe this one family, and nothing else. */
export function unsubscribeToken(familyId: string, secret: string): string {
  return `${familyId.toLowerCase()}.${unsubscribeSig(familyId, secret)}`
}

/** The family a token belongs to, or null if it was not signed by us. */
export function familyFromUnsubscribeToken(token: string, secret: string): string | null {
  if (!secret) return null
  const [id, sig, extra] = token.split('.')
  if (extra !== undefined || !id || !sig || !UNSUBSCRIBE_ID.test(id)) return null
  const want = Buffer.from(unsubscribeSig(id, secret))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got) ? id.toLowerCase() : null
}
