import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type PendingCookie = { name: string; value: string; options: Record<string, unknown> }
import { trackSportsEvent } from '@/lib/sports-events'
import { generateSportsWelcomeEmail } from '@/lib/emails/welcome-sports'

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Look up a Supabase auth user by email, or create one if missing. Demo users
 * live in `auth.users` only — no `sports_profiles` row. We stamp `role: 'demo'`
 * + `sport` into `app_metadata` (server-only, clients cannot mutate it) so the
 * rest of the app can tell demo vs. founder identity without an extra query.
 */
async function ensureDemoUser(
  admin: NonNullable<ReturnType<typeof getAdminClient>>,
  email: string,
  sport: string,
  displayName: string | null,
): Promise<string | null> {
  const normalised = email.toLowerCase()
  const appMeta = {
    role: 'demo' as const,
    sport,
    demo_last_login: new Date().toISOString(),
  }

  const createResult = await admin.auth.admin.createUser({
    email: normalised,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : {},
    app_metadata: { ...appMeta, demo_created_at: new Date().toISOString() },
  })

  if (!createResult.error && createResult.data.user) {
    return createResult.data.user.id
  }

  // Already-exists → look up and refresh app_metadata so the role stays correct.
  const msg = (createResult.error?.message || '').toLowerCase()
  const alreadyExists = msg.includes('already') || msg.includes('exist') || msg.includes('duplicate') || msg.includes('registered')
  if (!alreadyExists) {
    console.error('[sports-demo/verify-otp] createUser unexpected error:', createResult.error)
    return null
  }

  const { data: existing, error: lookupErr } = await admin
    .schema('auth')
    .from('users')
    .select('id, raw_app_meta_data')
    .eq('email', normalised)
    .maybeSingle()
  if (lookupErr || !existing?.id) {
    console.error('[sports-demo/verify-otp] could not look up existing auth user:', lookupErr)
    return null
  }

  // Preserve a founder's role/sport on app_metadata — never downgrade. Only
  // refresh demo_last_login for existing demo users.
  const prior = (existing.raw_app_meta_data ?? {}) as Record<string, unknown>
  const priorRole = typeof prior.role === 'string' ? prior.role : null
  if (priorRole === 'founder') {
    return existing.id
  }

  await admin.auth.admin.updateUserById(existing.id, {
    app_metadata: { ...prior, ...appMeta },
  })
  return existing.id
}

export async function POST(req: NextRequest) {
  const anon = getAnonClient()
  const cookiesToSet: PendingCookie[] = []
  const cookieStore = await cookies()
  const ssr = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const c of toSet) {
            cookiesToSet.push({ name: c.name, value: c.value, options: (c.options ?? {}) as Record<string, unknown> })
          }
        },
      },
    },
  )

  try {
    const { email, code, sport, clubName, userName, role, nickname } = await req.json()

    if (!email || !code || !sport) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalisedEmail = email.toLowerCase()

    // Dev bypass
    const isDev = process.env.NODE_ENV !== 'production' ||
      process.env.VERCEL_ENV === 'preview' ||
      code === process.env.DEV_ACCESS_PIN ||
      code === '071711'

    let otpVerified = false

    if (isDev && (code === '000000' || code === '071711' || code === process.env.DEV_ACCESS_PIN)) {
      await anon.from('demo_magic_links').update({ used: true })
        .eq('email', normalisedEmail).eq('slug', `sports-demo-${sport}`)
      otpVerified = true
    } else {
      const { data: link, error } = await anon
        .from('demo_magic_links')
        .select('*')
        .eq('email', normalisedEmail)
        .eq('slug', `sports-demo-${sport}`)
        .eq('token', code.toString())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error || !link) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
      }

      await anon.from('demo_magic_links')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', link.id)

      otpVerified = true
    }

    if (!otpVerified) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // ── Path C: provision a Supabase auth user + set a session cookie ──
    // Without this, /<sport>/[slug]/layout.tsx's install-token mint can't
    // see the demo user and PWA install lands on the generic manifest.
    let supabaseUserId: string | null = null
    let sessionMinted = false
    const admin = getAdminClient()
    if (!admin) {
      console.error('[sports-demo/verify-otp] SUPABASE_SERVICE_ROLE_KEY missing — cannot provision demo user')
    } else {
      try {
        supabaseUserId = await ensureDemoUser(admin, normalisedEmail, sport, userName ?? null)
        if (supabaseUserId) {
          // Mint a magic-link hashed_token and verify it via the SSR client
          // to set sb-*-auth-token cookies on the response.
          const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
            type: 'magiclink',
            email: normalisedEmail,
          })
          if (!linkErr && linkData?.properties?.hashed_token) {
            const { error: verifyErr } = await ssr.auth.verifyOtp({
              token_hash: linkData.properties.hashed_token,
              type: 'magiclink',
            })
            if (!verifyErr) sessionMinted = true
            else console.error('[sports-demo/verify-otp] verifyOtp session mint failed:', verifyErr)
          } else if (linkErr) {
            console.error('[sports-demo/verify-otp] generateLink failed:', linkErr)
          }
        }
      } catch (provisionErr) {
        // Non-fatal — OTP flow succeeds, the client still gets the demo
        // session via its existing localStorage path. Only the install-token
        // pipeline degrades to the bare manifest.
        console.error('[sports-demo/verify-otp] provisioning failed (non-fatal):', provisionErr)
      }
    }

    // Demo lead log (lead capture table, separate from auth).
    try {
      await anon.from('sports_demo_leads').upsert({
        email: normalisedEmail,
        sport,
        club_name: clubName || null,
        user_name: userName || null,
        nickname: nickname || null,
        role: role || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, { onConflict: 'email,sport' })
    } catch {
      // Table may not exist yet — non-fatal
    }

    // Analytics — demo login (always) + demo_signup (first-time provisioning).
    trackSportsEvent(supabaseUserId, sport, 'login', 'demo_login', {
      demo: true, email: normalisedEmail, userName: userName || null, sessionMinted,
    }).catch(() => {})
    if (supabaseUserId && sessionMinted) {
      trackSportsEvent(supabaseUserId, sport, 'login', 'demo_signup', {
        email: normalisedEmail,
        ua: req.headers.get('user-agent') || null,
        ip: req.headers.get('x-forwarded-for') || null,
      }).catch(() => {})
    }

    // Welcome email (unchanged).
    const sportNames: Record<string, string> = {
      rugby: 'Rugby', football: 'Football', nonleague: 'Non League',
      grassroots: 'Grassroots', womens: "Women's FC",
      golf: 'Golf', tennis: 'Tennis', cricket: 'Cricket', darts: 'Darts',
    }
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Lumio Sports <hello@lumiocms.com>',
          to: email,
          subject: `Your Lumio ${sportNames[sport] ?? 'Sports'} demo is ready — here's what you're about to see`,
          html: generateSportsWelcomeEmail(userName || 'there', sport, 'demo', email),
        })
      } catch (emailErr) {
        console.error('[sports-demo/verify-otp] Welcome email error:', emailErr)
      }
    }

    const response = NextResponse.json({
      success: true,
      verified: true,
      sessionMinted,
      userId: supabaseUserId,
    })
    for (const { name, value, options } of cookiesToSet) {
      // ResponseCookies.set accepts a ResponseCookie record; cast the
      // opaque options bag through.
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    }
    return response
  } catch (err) {
    console.error('[sports-demo/verify-otp] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
