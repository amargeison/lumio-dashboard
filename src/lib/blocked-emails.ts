import { createClient } from '@supabase/supabase-js'

// Is this address barred from signing in?
//
// Checked at the point an OTP is MINTED, not after it is entered — a barred
// address should never receive a code at all. Also checked on verify, because
// somebody blocked between requesting and entering a code must not get in on it.
//
// Fails OPEN on an infrastructure error. A database blip must not lock every
// legitimate coach out of their portal; the cost of the rare miss is that a
// blocked address gets one more session, and the block still holds next time.
export async function isEmailBlocked(email?: string | null): Promise<boolean> {
  if (!email) return false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const admin = createClient(url, key, { auth: { persistSession: false } })
    const { data, error } = await admin.from('sports_blocked_emails')
      .select('email').eq('email', email.trim().toLowerCase()).maybeSingle()
    if (error) return false
    return !!data
  } catch { return false }
}

// What a blocked person sees. Deliberately flat and final: no hint that the
// address is specifically barred (which invites a retry from another address),
// and no support promise we would not honour for a competitor.
export const BLOCKED_MESSAGE = 'This email address cannot be used to sign in.'


// Does this address belong to somebody a head coach has invited?
//
// Asked of the DATABASE, not of the request. The client used to say so with
// purpose:'member', which works right up until a coach arrives by a route that
// does not know they are one — following the "explore the demo" button in their
// own invite email, for instance, where the demo gate has no idea who they are.
// They were then logged as a demo lead, sent "your demo is ready", and reported
// to support as a new signup.
//
// A membership is a fact about the person, so it holds whichever door they use.
export async function isAcademyMember(email?: string | null): Promise<boolean> {
  if (!email) return false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const admin = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await admin.from('coach_members')
      .select('id').ilike('email', email.trim().toLowerCase())
      .neq('status', 'revoked').limit(1)
    return !!data?.length
  } catch { return false }
}
