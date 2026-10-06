import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateSportsWelcomeEmail } from '@/lib/emails/welcome-sports'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isReservedEmail } from '@/lib/demo-visitor'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { findAuthUserByEmail, isValidEmail, slugForName, cleanSlug, RESERVED_SLUGS, MAX_NAME, MAX_SLUG } from '../_lib/account'

// All sport IDs the picker exposes
const ALLOWED_SPORTS = new Set([
  'tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens','junior','coach',
])

// The address the caller is signed in as, if they are.
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

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role credentials missing')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  let createdUserId: string | null = null
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    const raw = body as Record<string, unknown>
    const email = str(raw.email).toLowerCase()
    const displayName = str(raw.displayName)
    const nickname = str(raw.nickname) || null
    const sport = str(raw.sport)
    const avatarUrl = str(raw.avatarUrl) || null
    const brandLogoUrl = str(raw.brandLogoUrl) || null

    // The signup form sends `clubName`; older callers send `brandName`. Accept
    // either and derive the portal slug from it so impersonation works.
    const brand = str(raw.brandName) || str(raw.clubName)

    if (!email || !displayName || !sport) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    // Everything is checked BEFORE anything is created. A mistyped address used
    // to be refused only when the code was sent — by which time the account and
    // the academy already existed, holding the portal address for ever.
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (!brand) {
      return NextResponse.json({ error: 'Enter your club or academy name.' }, { status: 400 })
    }
    if (displayName.length > MAX_NAME) {
      return NextResponse.json({ error: `Your name is too long — please keep it under ${MAX_NAME} characters.` }, { status: 400 })
    }
    if (brand.length > MAX_NAME) {
      return NextResponse.json({ error: `That club name is too long — please keep it under ${MAX_NAME} characters.` }, { status: 400 })
    }
    // Never blank: a name with no letters or numbers gets a generated address.
    const portalSlug = slugForName(brand)
    // The stand-in accounts behind the shared demo code can never become real.
    if (isReservedEmail(email)) {
      return NextResponse.json({ error: 'That email address cannot be used to sign up.' }, { status: 400 })
    }
    if (!ALLOWED_SPORTS.has(sport)) {
      return NextResponse.json({ error: `Invalid sport: ${sport}` }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Who is asking. The sign-up page now checks the emailed code FIRST and
    // creates the academy afterwards, so it arrives here signed in as the
    // address it is signing up. A session for a different address is refused:
    // nobody creates an academy in somebody else's name from their own login.
    const session = await signedInAs()
    if (session && session.email !== email) {
      return NextResponse.json({ error: 'You are signed in with a different email address. Sign out first, then sign up again.' }, { status: 403 })
    }
    // …and with no session at all there is no proof the address is theirs.
    // This used to carry on and create the account and the academy anyway, so
    // anybody calling the route directly could set one up in a stranger's name
    // and take the portal address with it. The emailed code is the proof, and
    // entering it is what signs them in — so: no session, no academy.
    if (!session) {
      // Still counted, so the route cannot be used to hammer the server.
      if (!rateLimit(`create-profile-ip:${clientIp(req.headers)}`, 10, 10 * 60_000).ok) {
        return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Please confirm your email address first. Enter the code we emailed you, then try again.' }, { status: 401 })
    }

    // 1. Create the auth user (passwordless — login via OTP). Skipped when the
    // caller is already signed in as this address: the account exists.
    const { data: authData, error: authError } = session
      ? { data: null, error: null }
      : await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name: displayName, sport, plan: 'founding' },
        // Mark as a founder up-front so the shared OTP verify route preserves the
        // role (never downgrades them to a demo user) and skips the demo welcome.
        app_metadata: { role: 'founder', sport },
      })

    // An existing address is not necessarily a mistake.
    //
    //   · Already has a coach profile  → they have an account; send them to sign in.
    //   · Auth user but NO profile     → adopt it. This is the coach who was
    //     invited to somebody else's academy (which created their auth user) and
    //     is now starting their own, and the demo lead who later signs up
    //     properly. Refusing them meant the only way forward was a second email
    //     address, which then splits one person across two accounts for ever.
    let userId: string
    if (authError || !authData?.user) {
      const already = !!session || /already been registered|already exists|duplicate/i.test(authError?.message || '')
      if (!already) {
        // Not a conflict — a real failure. "fetch failed" here means this server
        // could not reach Supabase at all, which is worth saying plainly rather
        // than dressing up as a signup problem.
        const raw = authError?.message ?? 'Could not create account.'
        const network = /fetch failed|ECONNREFUSED|ENOTFOUND|timeout/i.test(raw)
        console.error('[sports-auth] createUser failed:', raw)
        return NextResponse.json({
          error: network
            ? 'We could not reach our servers just now. Please try again in a moment.'
            : raw,
        }, { status: network ? 503 : 400 })
      }

      // Every page, not just the first 200 — see findAuthUserByEmail.
      const existing = session
        ? (await supabase.auth.admin.getUserById(session.id)).data?.user ?? null
        : await findAuthUserByEmail(supabase, email)
      if (!existing) {
        return NextResponse.json({ error: 'That email is already registered. Please sign in instead.' }, { status: 409 })
      }

      const { data: prior } = await supabase.from('sports_profiles')
        .select('id, sport').eq('id', existing.id).maybeSingle()
      if (prior) {
        return NextResponse.json({
          error: 'You already have a Lumio account with this email. Please sign in instead.',
        }, { status: 409 })
      }

      // Adopt them. NOT assigned to createdUserId — the rollback below deletes
      // that id, and deleting a pre-existing user because a later step failed
      // would destroy an account we did not create.
      userId = existing.id
      await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...(existing.user_metadata ?? {}), display_name: displayName, sport, plan: 'founding' },
        app_metadata: { ...(existing.app_metadata ?? {}), role: 'founder', sport },
      }).catch(() => {})
    } else {
      userId = authData.user.id
      createdUserId = userId
    }

    // 2. Insert the sports profile row
    //
    // The portal address has to be free. Two academies can have the same name
    // ("Penrith Tennis Club" more than once), and since migration 186 the
    // database refuses a second one outright — which reached the coach as
    // "duplicate key value violates unique constraint" on the last step of
    // sign-up. Take the nearest free address instead (penrith-tennis-club-2);
    // they can change it during setup.
    const slugTaken = async (s: string) => {
      if (RESERVED_SLUGS.has(s)) return true
      const { data } = await supabase.from('sports_profiles')
        .select('id').eq('sport', sport).ilike('portal_slug', s).neq('id', userId).limit(1)
      return !!(data as { id: string }[] | null)?.length
    }
    // Room is left for the "-2" so a numbered address stays inside the limit.
    const stem = cleanSlug(portalSlug.slice(0, MAX_SLUG - 5))
    let finalSlug = portalSlug
    if (await slugTaken(finalSlug)) {
      let next: string | null = null
      for (let i = 2; i <= 50 && !next; i++) if (!(await slugTaken(`${stem}-${i}`))) next = `${stem}-${i}`
      finalSlug = next || `${stem}-${Date.now().toString(36).slice(-4)}`
    }
    const row = {
      id: userId,
      sport,
      display_name: displayName,
      nickname,
      avatar_url: avatarUrl,
      brand_name: brand,
      portal_slug: finalSlug,
      brand_logo_url: brandLogoUrl,
      plan: 'founding',
    }
    let { error: profileError } = await supabase.from('sports_profiles').insert(row)
    if (profileError && (profileError.code === '23505' && /portal_slug/.test(profileError.message))) {
      // Lost a race for the address between the check and the insert.
      finalSlug = `${stem}-${Date.now().toString(36).slice(-4)}`
      ;({ error: profileError } = await supabase.from('sports_profiles').insert({ ...row, portal_slug: finalSlug }))
    }

    if (profileError) {
      // Don't leave a zombie auth user behind
      console.error('[sports-auth] Profile insert failed, rolling back auth user:', profileError)
      // Only an auth user WE created. Adopting an existing one and then deleting
      // it because the profile insert failed would take out an account that was
      // working fine before this request.
      if (createdUserId) {
        try {
          await supabase.auth.admin.deleteUser(createdUserId)
        } catch (cleanupErr) {
          console.error('[sports-auth] Could not delete orphan auth user:', cleanupErr)
        }
      }
      return NextResponse.json(
        {
          error: `Could not create profile: ${profileError.message}`,
          hint: 'If this is a missing-table error, run migration 087_sports_auth.sql.',
        },
        { status: 500 },
      )
    }

    // The head coach is a coach. Their own staff record used to be created only
    // by finishing the setup wizard, so an academy that skipped it had a head
    // coach on the Coaches page and "Coaches 0" in the Court Planner, and nobody
    // to assign a booking or a home court to. Not fatal if it fails: the wizard
    // still creates the record when it finds none.
    if (sport === 'coach') {
      try {
        const { data: head } = await supabase.from('coach_staff')
          .select('id').eq('coach_id', userId).eq('is_head', true).limit(1)
        if (!(head as { id: string }[] | null)?.length) {
          const { error: headErr } = await supabase.from('coach_staff')
            .insert({ coach_id: userId, name: displayName, role: 'Head Coach', email, is_head: true })
          if (headErr) console.error('[sports-auth] head coach record failed (non-fatal):', headErr.message)
        }
      } catch (e) {
        console.error('[sports-auth] head coach record failed (non-fatal):', e)
      }
    }

    // Send welcome email (non-blocking — don't fail signup if email fails)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error: sendErr } = await resend.emails.send({
        from: 'Lumio Sports <hello@lumiocms.com>',
        to: email,
        subject: `Welcome to Lumio Sports, ${displayName.split(' ')[0]} 🎉`,
        html: generateSportsWelcomeEmail(displayName, sport, 'founder', email),
      })
      if (sendErr) console.error('[sports-auth/create-profile welcome] send rejected → @' + email.split('@')[1] + ':', sendErr)
    } catch (emailErr) {
      console.error('[sports-auth] Welcome email failed (non-fatal):', emailErr)
    }

    // Every sport's post-signup destination is /{sport}/app. The page itself
    // decides whether to render the live portal or the coming-soon placeholder.
    const redirectTo = `/${sport}/app`

    return NextResponse.json({
      success: true,
      userId,
      sport,
      redirectTo,
      // The address actually saved — not necessarily the one the form guessed
      // from the club name, if another academy already had that.
      portalSlug: finalSlug,
    })
  } catch (err) {
    console.error('[sports-auth] Unexpected error:', err)
    // Best-effort cleanup if we created an auth user before crashing
    if (createdUserId) {
      try {
        const supabase = getServiceClient()
        await supabase.auth.admin.deleteUser(createdUserId)
      } catch { /* ignore */ }
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Signup failed' },
      { status: 500 },
    )
  }
}
