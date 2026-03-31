import { NextResponse, type NextRequest } from 'next/server'

const RESERVED_SLUGS = new Set([
  'demo', 'dev', 'master', 'schools', 'school', 'trial-ended', 'website', 'demobusiness', 'dev-login',
  'demoschool', 'portallive', 'schoollive', 'login', 'signup', 'api',
  'overview', 'auth', 'public', 'static', 'home', 'pricing', 'about',
  'terms', 'privacy', 'cookies', 'support', 'success', 'settings',
  'workflows', 'strategy', 'trials', 'partners', 'buy', 'book-demo',
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'offline', 'admin', 'blog', 'football',
])

const DASHBOARD_ROUTES = new Set([
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'workflows', 'strategy', 'trials',
  'partners', 'support', 'success', 'settings', 'projects', 'onboarding',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Dev PIN gate (non-production only) ────────────────────────────────
  const isProduction = process.env.NEXT_PUBLIC_ENV === 'production'
  const devPin = process.env.DEV_ACCESS_PIN
  if (!isProduction && devPin) {
    const isExcluded = pathname === '/dev-login'
      || pathname.startsWith('/api/')
      || pathname.startsWith('/_next/')
      || /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff2?|ttf)$/i.test(pathname)
    if (!isExcluded) {
      const cookie = request.cookies.get('lumio_dev_access')?.value
      if (cookie !== devPin) {
        const url = request.nextUrl.clone()
        url.pathname = '/dev-login'
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

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
