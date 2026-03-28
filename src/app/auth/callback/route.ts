import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
  const error = requestUrl.searchParams.get('error')

  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()
    let supabaseResponse = NextResponse.next({ request })

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

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, slug, is_demo, status')
        .eq('owner_email', data.user?.email)
        .maybeSingle()

      if (!tenant) {
        const loginUrl = new URL('/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'no_account')
        return NextResponse.redirect(loginUrl)
      }

      if (tenant.is_demo) {
        return NextResponse.redirect(new URL(`/demo/${tenant.slug}`, requestUrl.origin))
      }

      const destination = redirectTo.startsWith('/') ? redirectTo : `/${tenant.slug}`
      const finalUrl = new URL(destination, requestUrl.origin)
      const redirectResponse = NextResponse.redirect(finalUrl)
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
