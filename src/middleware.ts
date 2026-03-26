import { NextResponse, type NextRequest } from 'next/server'

// DEMO-BUSINESS BRANCH — root redirects to business demo workspace
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root → business demo workspace
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/demo/lumio-demo'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
