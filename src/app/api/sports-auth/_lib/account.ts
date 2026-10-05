import type { SupabaseClient, User } from '@supabase/supabase-js'

// Small pieces the sign-up and sign-in routes share, so they cannot drift apart
// — which is how the address checker came to allow a word sign-up reserves.

// ── Finding one account by its email ────────────────────────────────────────
// The sign-in service lists accounts a page at a time (50 by default) and has
// no "find by email". Reading only the first page worked until the 51st account
// existed; after that a real head coach was told "We don't recognise that
// email" at sign-in and "You already have an account" at sign-up, with no way
// in from either. So: walk every page until the address turns up or the list
// runs out.
const PAGE_SIZE = 1000
const MAX_PAGES = 500

export async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const want = email.trim().toLowerCase()
  if (!want) return null
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    // A failed read is not "no such account" — say so, and let the caller stop.
    if (error) throw new Error(`Could not look up account: ${error.message}`)
    const users = data?.users ?? []
    const hit = users.find(u => (u.email || '').toLowerCase() === want)
    if (hit) return hit
    if (users.length < PAGE_SIZE) return null
  }
  return null
}

// ── Email ───────────────────────────────────────────────────────────────────
// The same shape the code-sending route insists on, so an address is refused
// here, before anything is created, rather than after.
//
// Dots separate parts, so there is never one at either end of the name or the
// domain, and never two together: "x@y..com" used to pass, and so did
// ".x@y.com" and "x@.y.com" — none of which can receive a code. No "*" either:
// it is a wildcard wherever an address is looked up (see exactEmailPattern).
export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && !v.includes('*') && /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/.test(v.trim())
}

// An address as a pattern that matches only itself (in any case). "%" and "_"
// are wildcards to the database and "*" is the database API's own spelling of
// "%": the first two are escaped, and isValidEmail refuses the third.
export function exactEmailPattern(email: string): string {
  return email.trim().toLowerCase().replace(/[\\%_]/g, m => `\\${m}`)
}

// ── Portal addresses ────────────────────────────────────────────────────────
// Words that would collide with pages rather than with other academies.
export const RESERVED_SLUGS = new Set(['demo', 'admin', 'new', 'settings', 'login', 'signup', 'api', 'portal', 'lumio', 'test', 'sso', 'guides'])

export const MAX_SLUG = 60
export const MAX_NAME = 80

// Letters, numbers and single hyphens; never a hyphen at either end.
export function cleanSlug(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, MAX_SLUG).replace(/-+$/g, '')
}

// The address for a new academy, from its name. A name with no Latin letters or
// digits ("东京网球学院", "🎾🎾") cleans down to nothing, and a blank address sent
// the coach to a different product altogether — so those get a generated one,
// which they can change during setup.
export function slugForName(name: string | null | undefined): string {
  const s = cleanSlug(name || '')
  if (s.length >= 2) return s
  return `academy-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`
}
