import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateSportsWelcomeEmail } from '@/lib/emails/welcome-sports'
import { slugify } from '@/lib/sports-admin/portal-url'

// All sport IDs the picker exposes
const ALLOWED_SPORTS = new Set([
  'tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens','junior','coach',
])

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
    const body = await req.json()
    const {
      email,
      displayName,
      nickname,
      sport,
      brandName,
      clubName,
      avatarUrl,
      brandLogoUrl,
    } = body as Record<string, string | null | undefined>

    // The signup form sends `clubName`; older callers send `brandName`. Accept
    // either and derive the portal slug from it so impersonation works.
    const brand = brandName || clubName || null
    const portalSlug = brand ? slugify(brand) : null

    if (!email || !displayName || !sport) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!ALLOWED_SPORTS.has(sport)) {
      return NextResponse.json({ error: `Invalid sport: ${sport}` }, { status: 400 })
    }

    const supabase = getServiceClient()

    // 1. Create the auth user (passwordless — login via OTP)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      const already = /already been registered|already exists|duplicate/i.test(authError?.message || '')
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

      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      const existing = list?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
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
    const { error: profileError } = await supabase.from('sports_profiles').insert({
      id: userId,
      sport,
      display_name: displayName,
      nickname: nickname ?? null,
      avatar_url: avatarUrl ?? null,
      brand_name: brand,
      portal_slug: portalSlug,
      brand_logo_url: brandLogoUrl ?? null,
      plan: 'founding',
    })

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

    // Send welcome email (non-blocking — don't fail signup if email fails)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lumio Sports <hello@lumiocms.com>',
        to: email,
        subject: `Welcome to Lumio Sports, ${displayName.split(' ')[0]} 🎉`,
        html: generateSportsWelcomeEmail(displayName, sport, 'founder', email),
      })
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
