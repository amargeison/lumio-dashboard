// Shared helpers for the sports-admin area.

// Mirrors the slugify used at signup (src/app/sports-signup/page.tsx) so the
// admin reconstructs the same portal slug a coach was given.
export function slugify(s?: string | null): string {
  if (!s) return ''
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// The real portal URL for a sports account. Coach portals live under
// /tennis/coach/{slug}; women's under /womens/{slug}; everything else under
// /{sport}/{slug}. Prefer the stored portal_slug, then a slug derived from the
// club/brand, then the person's name, falling back to the demo portal only if
// we genuinely have nothing.
export function portalUrlFor(u: any): string {
  const slug = u?.portal_slug || slugify(u?.brand_name) || slugify(u?.display_name) || 'demo'
  if (u?.sport === 'coach') return `/tennis/coach/${slug}`
  if (u?.sport === 'womens') return `/womens/${slug}`
  return `/${u?.sport}/${slug}`
}

// Superadmin impersonation: opening this endpoint mints a real Supabase session
// for the account server-side, then 302-redirects into their live portal — so
// admins land straight inside the portal instead of the demo sign-in gate.
export function impersonateUrl(userId: string, token: string): string {
  return `/api/sports-admin/impersonate?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`
}
