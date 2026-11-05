// Display rules for the live school cards, kept out of the view so they can be tested.

export const NO_COACH = '—'

/** "In progress · Sam Test", or just "In progress" when no lead coach is set. */
export const withCoach = (text: string, coach: string | undefined) =>
  coach && coach !== NO_COACH ? `${text} · ${coach}` : text

// Fixed 0–100 scale. The 2px floor keeps a 0% session visible.
export const sessionBar = (pct: number) => ({ height: `${Math.min(100, Math.max(0, pct))}%`, minHeight: 2 })
