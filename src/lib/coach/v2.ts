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
  payments: 'Card payments arrive in V2. For now, take payment however you do today and record it here — the balances, chasers and reports all work the same way.',
  /** Text messages from Lumio's number. */
  sms: 'Texting arrives in V2. Email and the in-app message both send now, and the player sees them in their app.',
} as const

/** For a chip or pill next to a feature name. */
export const v2Chip = { label: V2_LABEL, title: 'Not in founders access — it arrives with the paid version.' }
