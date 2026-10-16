// What is NOT in founders access.
//
// V1 is the founders release: the coaches using Lumio now, free, while we find
// out what they actually need. V2 is the paid product. Two things are built far
// enough to be visible but are deliberately not switched on for V1 — card
// payments through Stripe, and text messages — because each costs real money to
// run and neither is worth turning on before a founding coach says they would
// use it.
//
// The rule this file exists to enforce: a feature that is not on must SAY it is
// not on, in the same words everywhere. A greyed-out button with no explanation
// reads as broken software; "Coming in V2" reads as a roadmap. Nothing here
// removes a feature — the code stays, the flags stay, and turning it on for V2
// is deleting a label rather than writing a feature.

export const V2_LABEL = 'Coming in V2'

export const V2_NOTES = {
  /** Card payments — Stripe Connect, checkout links, camp deposits. */
  // Card payments are ON (October 2026): a coach connects their own Stripe
  // account in Settings → Pricing & packages. This is what they are told
  // until they have.
  payments: 'Connect your bank to take card payments: Settings → Pricing & packages. The money goes straight to your own bank; Stripe’s fee comes off each payment and Lumio takes nothing. Until then, record payments here however you take them.',
  /** Text messages from Lumio's number. */
  sms: 'Texting arrives in V2. Email and the in-app message both send now, and the player sees them in their app.',
} as const

/** For a chip or pill next to a feature name. */
export const v2Chip = { label: V2_LABEL, title: 'Not in founders access — it arrives with the paid version.' }
