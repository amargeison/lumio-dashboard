import { NextResponse, type NextRequest } from 'next/server'

const RESERVED_SLUGS = new Set([
  'demo', 'schools', 'school', 'trial-ended', 'website', 'demobusiness',
  'demoschool', 'portallive', 'schoollive', 'login', 'signup', 'api',
  'overview', 'auth', 'public', 'static', 'home', 'pricing', 'about',
  'terms', 'privacy', 'cookies', 'support', 'success', 'settings',
  'workflows', 'strategy', 'trials', 'partners', 'buy', 'book-demo',
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'offline', 'admin', 'blog',
])

const DASHBOARD_ROUTES = new Set([
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'workflows', 'strategy', 'trials',
  'partners', 'support', 'success', 'settings', 'projects',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect / → /home
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  // Handle /{slug}/{department} → rewrite to /{department} internally
  // while keeping the URL as /{slug}/{department}
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const potentialSlug = parts[0]
    const potentialDept = parts[1]
    if (!RESERVED_SLUGS.has(potentialSlug) && DASHBOARD_ROUTES.has(potentialDept)) {
      const url = request.nextUrl.clone()
      // Rewrite to the department path, dropping the slug prefix
      url.pathname = '/' + parts.slice(1).join('/')
      const response = NextResponse.rewrite(url)
      // Pass slug to the app via cookie so sidebar can read it
      response.cookies.set('lumio_tenant_slug', potentialSlug, { path: '/' })
      return response
    }
  }

  // Handle /{slug} for non-reserved slugs → let [slug]/page.tsx handle it
  if (parts.length === 1 && !RESERVED_SLUGS.has(parts[0])) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
