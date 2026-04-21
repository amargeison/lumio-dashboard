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
  'nonleague', 'grassroots', 'join', 'sports-signup', 'sports-login', 'sports-admin',
])

const DASHBOARD_ROUTES = new Set([
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'school-office', 'workflows', 'strategy', 'trials',
  'partners', 'support', 'success', 'settings', 'projects', 'onboarding', 'directors',
])

// Sport route prefixes — these own their own auth/onboarding logic at the
// page level (founder Supabase check + SportsDemoGate fallback). Middleware
// must not redirect or rewrite these paths under any circumstance, otherwise
// a signed-in business user could get bounced to /overview, /sports, or a
// founder login when they're trying to reach a sport portal.
const SPORT_ROOTS = new Set([
  'tennis', 'golf', 'darts', 'boxing', 'cricket', 'rugby',
  'football', 'nonleague', 'grassroots', 'womens',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Sport routes: hands-off (with one exception) ──────────────────────
  // /sport/* must never be touched by middleware. The /sport/app auth check
  // below is a separate, intentional carve-out for the founder portal.
  // Everything else under /sport/* (including /sport/<demo-slug>) is owned
  // by the page component.
  //
  // The one exception: when the URL carries an ?install_token=, we
  // transparently route through /api/pwa/consume-token to redeem it
  // before the page renders. The redemption endpoint mints a fresh
  // session via Supabase magic-link and ultimately redirects to the
  // clean portal path with the install_token stripped — so the user
  // only ever sees /<sport>/<slug> in the URL bar, never the API.
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  if (firstSegment && SPORT_ROOTS.has(firstSegment)) {
    const secondSegment = segments[1]
    if (secondSegment !== 'app') {
      // Only intercept install_token on the canonical portal path
      // (exactly /<sport>/<slug>) — never on sub-routes like
      // /<sport>/<slug>/manifest.webmanifest, which the manifest route
      // legitimately receives the token on for token verification.
      const token = request.nextUrl.searchParams.get('install_token')
      if (token && secondSegment && segments.length === 2) {
        const consume = request.nextUrl.clone()
        consume.pathname = '/api/pwa/consume-token'
        consume.searchParams.delete('install_token')
        consume.searchParams.set('t', token)
        consume.searchParams.set('next', `/${firstSegment}/${secondSegment}`)
        return NextResponse.redirect(consume)
      }
      return NextResponse.next()
    }
    // Fall through to the /sport/app auth gate further down.
  }

  // /demo/* routes are always public — never redirect to auth
  if (pathname.startsWith('/demo/')) {
    return NextResponse.next()
  }

  // ── lumiocms.com takedown (production only) ─────────────────────────
  // Business + schools sit behind coming-soon waitlists until launch.
  // Fires only when NODE_ENV === 'production' AND host is lumiocms.com —
  // localhost and lumiosports.com are never affected. Rewrites (not
  // redirects) so the URL the visitor typed stays in the bar. /demo/**
  // is exempted above; /api, /about, /blog, /privacy, /cookies, /terms,
  // /contact and /coming-soon remain live.
  if (process.env.NODE_ENV === 'production') {
    const cmsHost = request.nextUrl.hostname
    const isLumioCms = cmsHost === 'lumiocms.com' || cmsHost === 'www.lumiocms.com'
    if (isLumioCms) {
      const ALWAYS_LIVE_PATHS = [
        '/coming-soon',
        '/about',
        '/contact',
        '/privacy',
        '/cookies',
        '/terms',
        '/blog',
        '/demo',
        '/api',
        '/_next',
        '/favicon',
      ]
      const STATIC_FILE_REGEX = /\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?|ttf|map)$/i
      const isAlwaysLive = ALWAYS_LIVE_PATHS.some(
        p => pathname === p || pathname.startsWith(p + '/'),
      )
      if (!STATIC_FILE_REGEX.test(pathname) && !isAlwaysLive) {
        const isSchoolsPath = pathname !== '/' && pathname.startsWith('/schools')
        const target = isSchoolsPath ? '/coming-soon/schools' : '/coming-soon/business'
        const url = request.nextUrl.clone()
        url.pathname = target
        return NextResponse.rewrite(url)
      }
    }
  }

  // ── Dev PIN gate (non-production only) ────────────────────────────────
  const hostname = request.nextUrl.hostname
  const isProductionDomain =
    hostname === 'lumiosports.com' || hostname === 'lumiocms.com' ||
    hostname === 'www.lumiosports.com' || hostname === 'www.lumiocms.com' ||
    hostname === 'app.lumiosports.com' || hostname === 'app.lumiocms.com'

  const devPin = process.env.DEV_ACCESS_PIN
  if (!isProductionDomain && devPin) {
    const isExcluded = pathname === '/dev-login'
      || pathname.startsWith('/api/')
      || pathname.startsWith('/_next/')
      || /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|html|woff2?|ttf)$/i.test(pathname)
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

  // ── Domain scope guard ────────────────────────────────────────────────
  // lumiosports.com must not serve business-product pages. If a visitor
  // somehow lands on /overview or another business dashboard path from a
  // sports domain (browser autocomplete, stale bookmark, third-party
  // redirect), bounce them to /sports. This also stops a signed-in
  // business user accidentally ending up on the business dashboard while
  // they're on the sports domain.
  const isSportsDomain =
    hostname === 'lumiosports.com' || hostname === 'www.lumiosports.com' || hostname === 'app.lumiosports.com'
  if (isSportsDomain) {
    const BUSINESS_ONLY_PREFIXES = [
      '/overview', '/hr', '/accounts', '/sales', '/crm', '/marketing',
      '/operations', '/it', '/insights', '/school-office', '/workflows',
      '/strategy', '/trials', '/partners', '/support', '/projects',
      '/onboarding', '/directors', '/dfe', '/settings', '/success',
    ]
    const isBusinessPath = BUSINESS_ONLY_PREFIXES.some(
      p => pathname === p || pathname.startsWith(p + '/'),
    )
    if (isBusinessPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/sports'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Root / is handled by src/app/page.tsx (host-based routing)
  // lumiosports.com/ → /sports, lumiocms.com/ → /home

  // Sports /{sport}/app routes — require an authenticated Supabase session.
  // The cookie name pattern is `sb-{ref}-auth-token` (Supabase SSR default).
  // The page itself also re-checks auth via createBrowserClient as a backup.
  const SPORTS_APP_SLUGS = new Set([
    'tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens',
  ])
  const sportsAppParts = pathname.split('/').filter(Boolean)
  if (sportsAppParts.length >= 2 && sportsAppParts[1] === 'app' && SPORTS_APP_SLUGS.has(sportsAppParts[0])) {
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
    if (!hasAuthCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/sports-login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Handle /{slug}/{department} → rewrite to /{department} internally
  // while keeping the URL as /{slug}/{department}
  const parts = pathname.split('/').filter(Boolean)

  // Belt-and-braces: under no circumstances should a /{sport}/{anything}
  // path ever be rewritten to a non-sport route. This is a hard guard on
  // top of the RESERVED_SLUGS check below so a future edit to that set
  // cannot accidentally redirect a player away from their sport portal.
  if (parts.length >= 1 && SPORTS_APP_SLUGS.has(parts[0])) {
    return NextResponse.next()
  }

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
