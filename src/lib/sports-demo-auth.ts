// Server-only identity helper for the /api/sports-demo/* routes.
//
// These routes run on the service-role key, so they bypass RLS entirely — the
// ONLY thing standing between a caller and someone else's lead row is the check
// below. Identity therefore comes from the Supabase session cookie, never from
// a request body or query string: verify-otp mints that cookie once the 6-digit
// code is confirmed, so "has a session for this address" is exactly the proof of
// ownership the OTP already established.
//
// Any new sports-demo route that reads or writes sports_demo_leads MUST resolve
// the caller through here and scope its query to the returned address.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isReservedEmail } from '@/lib/demo-visitor'

// The verified email on the caller's session, lowercased — or null if there
// isn't one. Uses getUser() (not getSession()): it validates the JWT against
// the auth server rather than trusting whatever the cookie happens to decode to.
export async function sessionEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const ssr = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { /* read-only */ } } },
    )
    const { data } = await ssr.auth.getUser()
    const email = data.user?.email?.toLowerCase() ?? null
    // A visitor on the shared demo code is signed in as a stand-in account. The
    // lead they may read and edit is the one for the address they typed, which
    // the server wrote into app_metadata at sign-in (the browser cannot change it).
    if (isReservedEmail(email)) {
      const typed = (data.user?.app_metadata as Record<string, unknown> | undefined)?.demo_email
      return typeof typed === 'string' && typed ? typed.toLowerCase() : null
    }
    return email
  } catch {
    return null // unreadable cookie == unauthenticated
  }
}

export type CallerCheck =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 }

// Resolve the caller and reject a body/query `email` that isn't theirs.
// The claimed address is only ever used to fail the request — never to select.
export async function resolveCaller(claimedEmail?: string | null): Promise<CallerCheck> {
  const email = await sessionEmail()
  if (!email) return { ok: false, status: 401 }
  if (claimedEmail && claimedEmail.toLowerCase() !== email) return { ok: false, status: 403 }
  return { ok: true, email }
}
