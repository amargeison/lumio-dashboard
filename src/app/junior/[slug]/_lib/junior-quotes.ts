// Junior dashboard quotes — exactly 7 entries indexed by day-of-week
// (0 = Sunday, 6 = Saturday). Drives the match-day hero quote band
// via getDayOfWeekQuote() so users see a different quote each day of
// the week, stable through the day.
//
// Youth-football / development / participation ethos. Where author is
// null the line is an internal / aphoristic Junior-product voice;
// attributed quotes carry the source.

export type JuniorQuote = { text: string; author: string | null }

export const JUNIOR_QUOTES: JuniorQuote[] = [
  { text: 'Every kid on the pitch. Every game.',                                           author: null     }, // 0 — Sunday
  { text: "It's not where they start. It's how far they travel.",                          author: null     }, // 1 — Monday
  { text: 'The best coaches teach the player, not the position.',                          author: null     }, // 2 — Tuesday
  { text: 'Football is the easiest sport in the world to learn. The hardest to master.',   author: 'Cruyff' }, // 3 — Wednesday
  { text: 'You only get one childhood. Spend it well.',                                    author: null     }, // 4 — Thursday
  { text: 'The next Premier League starter started somewhere like this.',                  author: null     }, // 5 — Friday
  { text: 'Win or lose, they get to play tomorrow.',                                       author: null     }, // 6 — Saturday
]

export function getDayOfWeekQuote(quotes: typeof JUNIOR_QUOTES) {
  return quotes[new Date().getDay() % quotes.length]
}
