import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { portalUrlFor } from '@/lib/sports-admin/portal-url'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { findAuthUserByEmail, isValidEmail, exactEmailPattern } from '../_lib/account'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Which kind of account an address has — the one thing the sign-in page must
// know BEFORE a code is sent, so it asks for the right kind of code.
//
// This is open to anyone who can reach the sign-in page, so a stranger gets
// that and nothing more: no academy name, no portal address, no head coach's
// name, not whether the person is a parent, a student or a coach. It used to
// return all of them for any address typed in.
//
// Everything else is the account holder's own business, and they get it by
// asking again once they are signed in: the session proves the address is
// theirs, and the answer then says where their portal is.
async function signedInAs(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies()
    if (!cookieStore.getAll().some(c => c.name.startsWith('sb-'))) return null
    const ssr = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )
    const { data: { user } } = await ssr.auth.getUser()
    return user?.email ? { id: user.id, email: user.email.toLowerCase() } : null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = (body as { email?: unknown } | null)?.email
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })

    const normalised = email.toLowerCase().trim()

    // Asking about your own address, while signed in as it.
    const session = await signedInAs()
    const self = session?.email === normalised

    // Anyone else: thirty questions per connection in ten minutes. Enough for a
    // club's shared wifi on enrolment night; not enough to work through a list
    // of addresses looking for which ones have accounts.
    if (!self) {
      const verdict = rateLimit(`identify-ip:${clientIp(req.headers)}`, 30, 10 * 60_000)
      if (!verdict.ok) {
        return NextResponse.json(
          { error: 'Too many attempts. Try again in a few minutes.' },
          { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSeconds) } },
        )
      }
    }

    // Check 1: Is this a founding member? (exists in auth.users + sports_profiles)
    const authUser = self ? { id: session!.id } : await findAuthUserByEmail(supabase, normalised)

    let founderSport: string | null = null
    let founderProfile: { sport: string; portal_slug: string | null; brand_name: string | null; display_name: string | null } | null = null
    if (authUser) {
      const { data: profile } = await supabase
        .from('sports_profiles')
        .select('sport, portal_slug, brand_name, display_name')
        .eq('id', authUser.id)
        .maybeSingle()
      if (profile) { founderSport = profile.sport; founderProfile = profile }
    }
    const founderFields = self && founderProfile ? {
      founderSlug: founderProfile.portal_slug,
      founderBrand: founderProfile.brand_name,
      founderDisplayName: founderProfile.display_name,
    } : {}

    // Check 2: Is this an invited portal member? A coach, parent or student the
    // head coach added. They have no sports_profiles row of their own, so
    // without this they identify as 'unknown' and the sign-in dead-ends.
    //
    // Checked BEFORE the demo lead so somebody who once poked at a demo and was
    // later invited as a real coach is treated as the coach.
    const { data: member } = await supabase
      .from('coach_members')
      .select('role, status, academy_id')
      // The whole address, whatever its case — and nothing else. This is a
      // pattern match, and "%" and "_" used to go into it as typed: "%@club.com"
      // or "t%@club.com" answered "member", so addresses could be worked out a
      // character at a time. See exactEmailPattern.
      .ilike('email', exactEmailPattern(normalised))
      .neq('status', 'revoked')
      // One address can hold several memberships now (a parent has one per
      // child; a coach can also be a parent). A coach membership wins — 'coach'
      // sorts before 'parent' and 'student' — so a coach whose own child is
      // invited later is still sent to the coach portal.
      .order('role', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check 3: Is this a demo user? (exists in sports_demo_leads)
    const { data: demoLead } = await supabase
      .from('sports_demo_leads')
      .select('sport, user_name, club_name, role')
      .eq('email', normalised)
      .order('last_seen', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Both accounts exist
    if (founderSport && demoLead) {
      return NextResponse.json({
        type: 'both',
        founderSport,
        ...founderFields,
        demoSport: demoLead.sport,
        ...(self ? { userName: demoLead.user_name, clubName: demoLead.club_name, role: demoLead.role } : {}),
      })
    }

    // A founder owns their own academy, which is the stronger identity — a head
    // coach invited to somebody else's academy still lands in their own portal.
    if (founderSport) {
      return NextResponse.json({ type: 'founder', sport: founderSport, ...founderFields })
    }

    if (member) {
      if (!self) return NextResponse.json({ type: 'member', sport: 'coach' })
      const { data: academy } = await supabase
        .from('sports_profiles')
        .select('brand_name, display_name, portal_slug, sport')
        .eq('id', member.academy_id).maybeSingle()

      // Worked out HERE rather than on the sign-in page, using the same helper
      // every other link to a portal uses. portal_slug is frequently null — it
      // falls back to a slug of the brand or display name — so requiring it on
      // the client silently dropped coaches back to the member portal.
      const memberDest = member.role === 'coach' && academy
        ? portalUrlFor({ ...academy, sport: 'coach' })
        : '/portal'

      return NextResponse.json({
        type: 'member',
        sport: 'coach',
        memberRole: member.role,
        clubName: academy?.brand_name || null,
        founderSlug: academy?.portal_slug || null,
        memberDest,
      })
    }

    if (demoLead) {
      return NextResponse.json({
        type: 'demo',
        sport: demoLead.sport,
        ...(self ? { userName: demoLead.user_name, clubName: demoLead.club_name, role: demoLead.role } : {}),
      })
    }

    // Unknown — not registered
    return NextResponse.json({ type: 'unknown' })
  } catch {
    return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 })
  }
}
