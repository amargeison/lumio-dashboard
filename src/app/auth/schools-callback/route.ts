import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    const loginUrl = new URL('/schools/login', requestUrl.origin)
    loginUrl.searchParams.set('error', error)
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/schools/login', requestUrl.origin))
  }

  const cookieStore = await cookies()
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (sessionError) throw sessionError

    const userEmail = data.user?.email
    if (!userEmail) throw new Error('No email in OAuth response')

    const domain = userEmail.split('@')[1]
    const serviceSupabase = getServiceSupabase()

    // 1. Check if user already exists as a school_user
    const { data: schoolUser } = await serviceSupabase
      .from('school_users')
      .select('school_id, schools(slug)')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    if (schoolUser) {
      const school = Array.isArray(schoolUser.schools) ? schoolUser.schools[0] : schoolUser.schools as { slug: string } | null
      if (school?.slug) {
        const redirectResponse = NextResponse.redirect(new URL(`/schools/${school.slug}`, requestUrl.origin))
        supabaseResponse.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
      }
    }

    // 2. Look up school by email domain
    const { data: school } = await serviceSupabase
      .from('schools')
      .select('id, slug')
      .eq('email_domain', domain)
      .eq('active', true)
      .maybeSingle()

    if (school) {
      // Auto-create school_user record for this OAuth user
      await serviceSupabase.from('school_users').insert({
        school_id: school.id,
        user_id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || userEmail.split('@')[0],
        email: userEmail.toLowerCase(),
        role: 'staff',
      })

      const redirectResponse = NextResponse.redirect(new URL(`/schools/${school.slug}`, requestUrl.origin))
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    }

    // 3. No school found — redirect to login with error
    const loginUrl = new URL('/schools/login', requestUrl.origin)
    loginUrl.searchParams.set('sso_error', 'no_school')
    loginUrl.searchParams.set('email', userEmail)
    const redirectResponse = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  } catch (err) {
    console.error('Schools OAuth callback error:', err)
    return NextResponse.redirect(new URL('/schools/login?error=auth_failed', requestUrl.origin))
  }
}
