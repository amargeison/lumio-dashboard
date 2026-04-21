// Canonical demo slug check for the sports portal. The URL — not the session —
// decides whether a `/<sport>/[slug]` route renders the curated Alex Rivera /
// Jake Morrison / James Halton / Marcus Reid demo content or the founder
// empty-state shell.
//
// Session-driven gating (`session.isDemoShell === false`) is unreliable for
// anonymous visitors: `undefined === false` is false, so incognito hits would
// fall through to demo content on founder URLs. Routing this decision through
// the slug makes it deterministic without depending on auth state.
//
// Two URL forms count as "demo" for each sport:
//   /<sport>/demo            — the short canonical form used in nav + CTAs
//   /<sport>/<sport>-demo    — the long form (e.g. tennis-demo) used in older
//                              links and some marketing copy
// Everything else (including unknown slugs) renders as founder / empty.

const VALID_SPORTS = new Set(['tennis', 'golf', 'darts', 'boxing'])

export function isDemoSlug(slug: string, sport: string): boolean {
  if (!VALID_SPORTS.has(sport)) return false
  return slug === 'demo' || slug === `${sport}-demo`
}
