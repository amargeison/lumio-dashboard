import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Website routing — lumiocms.com and www.lumiocms.com
  const isWebsite = hostname === 'lumiocms.com' || hostname === 'www.lumiocms.com'
  const websiteRoutes = ['/home', '/product', '/pricing', '/about', '/demo', '/crm']

  if (isWebsite) {
    // If hitting root, redirect to /home
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
    // Allow all website routes through without auth
    if (websiteRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
  }

  // Dashboard auth protection — app.lumiocms.com
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/home') || pathname.startsWith('/demo')) {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}