// Canonical demo slugs for the sports portal. The URL — not the session —
// decides whether a `/<sport>/[slug]` route renders the curated Alex Rivera /
// Jake Morrison / James Halton / Marcus Reid demo content or the founder
// empty-state shell.
//
// Session-driven gating (`session.isDemoShell === false`) is unreliable for
// anonymous visitors: `undefined === false` is false, so incognito hits would
// fall through to demo content on founder URLs. Routing this decision through
// the slug makes it deterministic without depending on auth state.
export const DEMO_SLUGS = new Set<string>([
  'tennis-demo',
  'golf-demo',
  'darts-demo',
  'boxing-demo',
])

export function isDemoSlug(slug: string): boolean {
  return DEMO_SLUGS.has(slug)
}
