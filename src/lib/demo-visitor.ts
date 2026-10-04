// The shared demo code, and who it signs you in as.
//
// A demo code that everybody knows cannot prove that you own an email address.
// So a sign-in with that code is never a sign-in AS the address typed: it gets
// a stand-in account that belongs to nobody, has no academy and can never be
// given one. The address typed is kept only so the demo can greet the visitor
// and so the lead is recorded.
//
// The stand-in lives on a domain that receives no mail, so nobody can ever be
// sent a real code for it, and the sign-up and invite routes refuse it.

import { createHash } from 'crypto'

export const DEMO_VISITOR_DOMAIN = 'demo-visitor.lumiosports.com'

export function demoVisitorEmail(typedEmail: string): string {
  const h = createHash('sha256').update(typedEmail.trim().toLowerCase()).digest('hex').slice(0, 24)
  return `v-${h}@${DEMO_VISITOR_DOMAIN}`
}

// True for an address no real person may sign up, be invited or be sent a code as.
export function isReservedEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase().endsWith('@' + DEMO_VISITOR_DOMAIN)
}

// Is this one of the codes that are shared rather than emailed?
export function isSharedDemoCode(code: unknown): boolean {
  const c = String(code ?? '')
  const pin = process.env.DEV_ACCESS_PIN
  return c === '071711' || (!!pin && c === pin)
}
