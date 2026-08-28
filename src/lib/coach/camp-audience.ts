// ─────────────────────────────────────────────────────────────────────────────
// Who a camp is for, and who each email is actually addressed to.
//
// One rule in one place. This test existed in three copies before — the cron,
// the roster blast and the Promote tab each had their own `age == null || < 16`,
// which meant a fix to one silently left the others wrong.
//
// No imports on purpose: the coach's browser, the public sign-up route and the
// cron all need it.
// ─────────────────────────────────────────────────────────────────────────────

export type Audience = 'junior' | 'adult' | 'mixed'

export const AUDIENCES: { id: Audience; label: string; blurb: string }[] = [
  { id: 'junior', label: 'Juniors',
    blurb: 'Children. Emails go to a parent, and the sign-up page asks for a guardian and consents.' },
  { id: 'adult', label: 'Adults',
    blurb: 'Everyone is written to directly. No parent or child language anywhere.' },
  { id: 'mixed', label: 'Both',
    blurb: 'A family week or an open camp. Each person’s own age decides how they are addressed.' },
]

/** The age at which somebody is written to directly rather than through a parent. */
export const ADULT_AGE = 16

export function campAudience(camp?: { audience?: string | null } | null): Audience {
  const a = String(camp?.audience || '').toLowerCase()
  return a === 'adult' || a === 'mixed' ? a : 'junior'
}

/**
 * Is this particular person written to directly?
 *
 * On an adult camp, always — including when we have no age at all, which is the
 * whole point: adults booking a tennis holiday do not fill in a date of birth,
 * and defaulting them to "child" is what produced "Hi Sarah, we've got Sarah
 * down for the camp".
 *
 * Otherwise their own age decides, and an unknown age means a junior. That is
 * the safeguarding-conservative direction and it stays that way.
 */
export function isAdult(camp: { audience?: string | null } | null | undefined, age: number | null | undefined): boolean {
  if (campAudience(camp) === 'adult') return true
  if (age == null || Number.isNaN(Number(age))) return false
  return Number(age) >= ADULT_AGE
}

/** True where anything on this camp should mention parents, guardians or consent. */
export function usesGuardians(camp?: { audience?: string | null } | null): boolean {
  return campAudience(camp) !== 'adult'
}

/**
 * The line handed to Lumio Coach so he knows who he is writing to. Given to
 * every camp prompt — the announcement, the itinerary designer, the countdown
 * emails and the end-of-camp report — so one setting moves all of them together.
 */
export function audienceBrief(camp?: { audience?: string | null; ages?: string | null } | null): string {
  const ages = String(camp?.ages || '').trim()
  switch (campAudience(camp)) {
    case 'adult':
      return `WHO THIS IS FOR: adults${ages ? ` (${ages})` : ''}. They booked it themselves and they are paying for it themselves. Write to the player directly — "you", never "your child". Never mention parents, guardians, drop-off, collection or school. They are grown adults choosing how to spend a week of their own holiday, so no encouragement that would sound patronising to a 45-year-old club player.`
    case 'mixed':
      return `WHO THIS IS FOR: a mix of adults and juniors${ages ? ` (${ages})` : ''}. Write so it works read by an adult player AND by the parent of a child — address "you" where you can, and avoid anything that only makes sense for one of them.`
    default:
      return `WHO THIS IS FOR: juniors${ages ? ` (${ages})` : ''}. A parent or guardian reads this and makes the decision. Write to the parent about their child.`
  }
}
