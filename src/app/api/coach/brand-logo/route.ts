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
function trustedLogoHost(src: string): boolean {
  try {
    const u = new URL(src)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const ours = [process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://www.lumiosports.com', 'https://lumiosports.com']
      .map(o => { try { return o ? new URL(o).host : '' } catch { return '' } })
      .filter(Boolean)
    return ours.includes(u.host)
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  const brand = await partnerBrandBySlug(slug)
  const src = brand?.logoUrl || ''
  // A logo stored as a web address is only forwarded to when it is on storage
  // we run. The address is whatever was saved against the academy, so forwarding
  // to it blindly made this public link a way to send anyone to any site.
  // Anything else is not served at all.
  if (/^https?:\/\//i.test(src)) {
    return trustedLogoHost(src) ? NextResponse.redirect(src, 302) : new NextResponse('Not found', { status: 404 })
  }
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
