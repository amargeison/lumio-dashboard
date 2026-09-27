import { NextRequest, NextResponse } from 'next/server'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'

export const runtime = 'nodejs'

// An academy's logo at a real web address.
//
// Logos are uploaded as data URLs and stored that way, which is fine inside the
// portal — but Gmail, Outlook and most other mail clients refuse to show a data
// URL image, so a welcome email carrying one arrived with a broken picture where
// the club's badge should be. Emails point here instead.
//
// Public on purpose: a club badge is already on the club's own website, and it
// is the whole point of a branded sign-in page. Nothing else about the academy
// is returned.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  const brand = await partnerBrandBySlug(slug)
  const src = brand?.logoUrl || ''
  if (/^https?:\/\//.test(src)) return NextResponse.redirect(src, 302)
  const m = /^data:(image\/(?:png|jpe?g|gif|webp|svg\+xml));base64,(.+)$/i.exec(src)
  if (!m) return new NextResponse('Not found', { status: 404 })
  const body = Buffer.from(m[2], 'base64')
  return new NextResponse(body, {
    headers: {
      'Content-Type': m[1].toLowerCase(),
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      // An uploaded SVG could carry script; never let this address run it.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
