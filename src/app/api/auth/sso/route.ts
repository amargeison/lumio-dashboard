import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { domain, redirectTo } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
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

    const ssoIdentifier = domain.includes('@') ? domain.split('@')[1] : domain

    const { data, error } = await supabase.auth.signInWithSSO({
      domain: ssoIdentifier,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ url: data?.url })
  } catch (error) {
    console.error('SSO route error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
