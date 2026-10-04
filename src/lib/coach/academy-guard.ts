// "Is this signed-in person part of a real academy?"
//
// Being signed in is not enough to spend money. The public demo signs every
// visitor in with a throwaway account so the portal has a session to work
// with — which means "is there a user?" is true for anybody who has typed an
// email address into the demo gate. Routes that cost something (Lumio Coach,
// transcription, storage) or that send something (email, invites, payments)
// checked only that, so a demo account could call them directly and run up a
// bill, or send mail, without ever owning an academy.
//
// This is the stronger question, asked of the database rather than of the
// session: does this user OWN an academy (a coach profile of their own), or
// are they an active coach in somebody else's? A demo account is neither.
//
// The demo portal itself never reaches these routes any more — it answers them
// in the browser (see src/app/coach/[slug]/_lib/demo). This is the lock on the
// door for anybody who goes round the portal and calls the API by hand.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Remember a YES for a few minutes: a coach building a session makes several
// calls in a row and each should not cost two lookups. A NO is never
// remembered — someone who has just created their academy must not be told
// "no academy" for the next five minutes.
const known = new Map<string, number>()
const TTL = 5 * 60_000

export async function isAcademyUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const until = known.get(userId)
  if (until && until > Date.now()) return true
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const [{ data: own }, { data: member }] = await Promise.all([
      db.from('sports_profiles').select('id, sport').eq('id', userId).maybeSingle(),
      db.from('coach_members').select('id').eq('member_user_id', userId).eq('status', 'active').eq('role', 'coach').limit(1),
    ])
    const ok = (own?.sport === 'coach') || (member || []).length > 0
    if (ok) {
      known.set(userId, Date.now() + TTL)
      if (known.size > 2000) for (const [k, v] of known) if (v < Date.now()) known.delete(k)
    }
    return ok
  } catch (e) {
    // If the check itself cannot be made, refuse: the failure mode of a spend
    // guard must be "no spend", and a real coach just presses the button again.
    console.error('[academy-guard]', e)
    return false
  }
}

/** The one response every guarded route gives a signed-in person with no academy. */
export function notAnAcademy() {
  return NextResponse.json({ error: 'This is only available inside your own academy portal.' }, { status: 403 })
}
