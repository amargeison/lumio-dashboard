// Safe to import in the browser (no Node modules).
//
// A visitor who came in on the shared demo code is signed in as a stand-in
// account (see demo-visitor.ts). The address they typed is carried in
// app_metadata, which only the server can write. Show that one.
type U = { email?: string | null; app_metadata?: Record<string, unknown> | null } | null | undefined
export function visibleEmail(user: U): string {
  const typed = user?.app_metadata?.demo_email
  return (typeof typed === 'string' && typed) || user?.email || ''
}
