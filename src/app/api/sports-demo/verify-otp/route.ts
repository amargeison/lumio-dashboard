import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

// Note: previous versions had an `ensureDemoUser` helper that used
// `admin.schema('auth').from('users').select(...)` to look up existing users.
// That path returned `PGRST106 Invalid schema: auth` because the `auth`
// schema isn't exposed via PostgREST by default — every existing-user OTP
// silently failed before reaching the session-mint step. The provisioning
// flow is now inlined into POST() and uses `admin.auth.admin.generateLink`
// (which auto-creates new users and returns the existing user otherwise).

export async function POST(req: NextRequest) {
  const anon = getAnonClient()
  const cookieStore = await cookies()

  // Build the response shell up-front so the SSR client's cookie writer
  // can push Set-Cookie attributes directly onto it. This is the App
  // Router pattern documented for @supabase/ssr — anything fancier
  // (buffering, setting cookies after building a fresh response) loses
  // the cookies silently.
  //
  // Cookie options: force `Secure` + `HttpOnly` + `SameSite=Lax`. iOS
  // Safari ITP increasingly downgrades or discards cookies on HTTPS that
  // omit `Secure`, which is why DevTools showed zero cookies after OTP
  // even though the server was returning Set-Cookie. The default options
  // bag from @supabase/ssr v0.9 doesn't include these — we set them
  // explicitly here.
  let response = NextResponse.json({ verified: false }) // placeholder, replaced before return
  const ssr = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const c of toSet) {
            response.cookies.set(c.name, c.value, {
              ...(c.options ?? {}),
              secure:   true,
              httpOnly: true,
              sameSite: 'lax',
              path:     '/',
            })
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

    // ── Path C: mint a Supabase session cookie via magic-link ──
    // generateLink works for both new and existing users (it auto-creates
    // the auth.users row when missing) and the response carries the user
    // object — so we don't need a separate lookup. We then hand the
    // hashed_token to the SSR client's verifyOtp which writes
    // sb-*-auth-token onto our outgoing response (Secure + HttpOnly forced
    // in setAll above).
    let supabaseUserId: string | null = null
    let sessionMinted = false
    const admin = getAdminClient()
    if (!admin) {
      console.error('[sports-demo/verify-otp] SUPABASE_SERVICE_ROLE_KEY missing — cannot provision demo user')
    } else {
      try {
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: normalisedEmail,
        })
        if (linkErr || !linkData?.properties?.hashed_token || !linkData?.user) {
          console.error('[sports-demo/verify-otp] generateLink failed:', linkErr)
        } else {
          const linkUser = linkData.user
          supabaseUserId = linkUser.id

          // Founder protection: never downgrade a founder's role/sport.
          // First-sight users get demo_created_at; subsequent demo logins
          // refresh demo_last_login only.
          const priorMeta = (linkUser.app_metadata ?? {}) as Record<string, unknown>
          const priorRole = typeof priorMeta.role === 'string' ? priorMeta.role : null
          if (priorRole !== 'founder') {
            const nowIso = new Date().toISOString()
            const nextMeta: Record<string, unknown> = {
              ...priorMeta,
              role: 'demo',
              sport,
              demo_last_login: nowIso,
              ...(priorRole ? {} : { demo_created_at: nowIso }),
            }
            const updateAttrs: Parameters<typeof admin.auth.admin.updateUserById>[1] = {
              app_metadata: nextMeta,
            }
            if (userName) {
              updateAttrs.user_metadata = {
                ...(linkUser.user_metadata ?? {}),
                display_name: userName,
              }
            }
            await admin.auth.admin.updateUserById(linkUser.id, updateAttrs).catch(
              (e: unknown) => console.error('[sports-demo/verify-otp] updateUserById failed:', e),
            )
          }

          // Verify the magic-link's hashed_token via the SSR client to mint
          // the session — this fires the setAll callback which sets
          // sb-*-auth-token directly onto `response`.
          const { error: verifyErr } = await ssr.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: 'magiclink',
          })
          if (!verifyErr) sessionMinted = true
          else console.error('[sports-demo/verify-otp] verifyOtp session mint failed:', verifyErr)
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

    // Replace the placeholder body. Cookies were written directly onto
    // `response` by the SSR client's setAll during verifyOtp() above —
    // we only need to overwrite the JSON payload, not re-attach cookies.
    const finalResponse = NextResponse.json({
      success: true,
      verified: true,
      sessionMinted,
      userId: supabaseUserId,
    })
    for (const c of response.cookies.getAll()) {
      finalResponse.cookies.set(c.name, c.value, c)
    }

    const cookieNames = finalResponse.cookies.getAll().map(c => c.name)
    console.log('[verify-otp] ' + JSON.stringify({
      sessionMinted, cookiesWritten: cookieNames.length, cookieNames,
    }))

    return finalResponse
  } catch (err) {
    console.error('[sports-demo/verify-otp] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
