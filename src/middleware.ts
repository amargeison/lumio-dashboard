import { NextResponse, type NextRequest } from 'next/server'

// Reserved slugs that must NOT be treated as business workspace slugs
const RESERVED_SLUGS = new Set([
  'demo', 'schools', 'school', 'trial-ended', 'website', 'demobusiness',
  'demoschool', 'portallive', 'schoollive', 'login', 'signup', 'api',
  'overview', 'auth', 'public', 'static', 'home', 'pricing', 'about',
  'terms', 'privacy', 'cookies', 'support', 'success', 'settings',
  'workflows', 'strategy', 'trials', 'partners', 'buy', 'book-demo',
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'offline',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root → marketing homepage
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
