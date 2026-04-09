import { NextResponse, type NextRequest } from 'next/server'

const RESERVED_SLUGS = new Set([
  'demo', 'master', 'neli', 'telted', 'schools', 'school', 'trial-ended', 'website', 'demobusiness', 'dev-login',
  'demoschool', 'portallive', 'schoollive', 'login', 'signup', 'api',
  'overview', 'auth', 'public', 'static', 'home', 'pricing', 'about',
  'terms', 'privacy', 'cookies', 'support', 'success', 'settings',
  'workflows', 'strategy', 'trials', 'partners', 'buy', 'book-demo',
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'offline', 'admin', 'blog', 'football',
  'womens', 'rugby', 'cricket', 'tennis', 'golf', 'boxing', 'darts',
  'nonleague', 'grassroots',
])

const DASHBOARD_ROUTES = new Set([
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'workflows', 'strategy', 'trials',
  'partners', 'support', 'success', 'settings', 'projects', 'onboarding', 'directors',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /demo/* routes are always public — never redirect to auth
  if (pathname.startsWith('/demo/')) {
    return NextResponse.next()
  }

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

  // Root / is handled by src/app/page.tsx (host-based routing)
  // lumiosports.com/ → /sports, lumiocms.com/ → /home

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

  // Handle /{slug} for non-reserved slugs
  if (parts.length === 1 && !RESERVED_SLUGS.has(parts[0])) {
    // Check if this slug is a demo tenant → redirect to /demo/[slug] or /demo/schools/[slug]
    const slug = parts[0]
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey) {
        const res = await fetch(`${supabaseUrl}/rest/v1/demo_tenants?slug=eq.${slug}&select=slug,tenant_type&limit=1`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        })
        if (res.ok) {
          const rows = await res.json()
          if (rows.length > 0) {
            const url = request.nextUrl.clone()
            url.pathname = rows[0].tenant_type === 'schools'
              ? `/demo/schools/${slug}`
              : `/demo/${slug}`
            return NextResponse.redirect(url)
          }
        }
      }
    } catch { /* fall through to default handling */ }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
