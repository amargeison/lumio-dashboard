import { NextResponse, type NextRequest } from 'next/server'

// DEV BRANCH — no auth required, all routes open
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Keep the root → /home redirect for the website-style landing
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/demo/schools/oakridge-primary'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
