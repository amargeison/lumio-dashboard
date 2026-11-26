// The consent rules that need nothing from the server, so the browser can use them too
// (audiences, the newsletter wizard). Re-exported by comms-rules.ts, which adds the
// signing helpers that need node:crypto.
//
// Unknown is never yes: consent columns are null until recorded, and only an
// explicit true passes.

export type CommsChannel = 'email' | 'sms' | 'app'

export interface ConsentFamily {
  id: string
  consent_data: boolean | null
  consent_photo: boolean | null
  opt_in_email: boolean
  opt_in_sms: boolean
  opt_in_app: boolean
  unsubscribed_at: string | null
}

export interface ConsentChild {
  id: string
  family_id: string | null
  name: string
  photo_consent: boolean | null
}

/** Why this family may not be contacted on this channel, or null if they may. */
export function contactBlock(f: ConsentFamily, channel: CommsChannel): string | null {
  if (f.unsubscribed_at) return 'Unsubscribed'
  if (f.consent_data !== true) return 'No contact consent on record'
  const optedIn = channel === 'email' ? f.opt_in_email : channel === 'sms' ? f.opt_in_sms : f.opt_in_app
  return optedIn === true ? null : `Opted out of ${channel === 'app' ? 'the app' : channel}`
}

/**
 * A number Twilio will accept (E.164), or null. UK mobiles in any usual form
 * become +447…; a number already in international form is kept. Anything else,
 * landlines included, can't take a text, so it is reported, not sent.
 */
export function toE164(raw: string): string | null {
  const s = raw.trim().replace(/\(0\)/g, '').replace(/[\s().-]/g, '')
  const uk = /^(?:\+44|0044|44|0)(7\d{9})$/.exec(s)
  if (uk) return `+44${uk[1]}`
  if (/^\+44/.test(s)) return null
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null
}

