import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'

export const runtime = 'nodejs'

// An academy's badge as a square icon — the browser-tab favicon, the iPhone
// home-screen icon and the installed-app icon for its portal and player app.
//
// Club logos come in every shape, and a wide one handed to the browser as a
// favicon gets squashed or clipped. This fits the logo, whole, inside a square:
// transparent for the small tab sizes, on the academy's own background for the
// home-screen sizes (iOS paints a transparent icon black otherwise).
//
// Only for an academy that has switched its partner sign-in page on: that is
// the "show our brand, not Lumio's" switch. Everyone else keeps Lumio's icon.

const SIZES = new Set([16, 32, 48, 64, 180, 192, 512])

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const size = Number(sp.get('size') || 64)
  if (!SIZES.has(size)) return new NextResponse('Bad size', { status: 400 })

  const brand = await partnerBrandBySlug(sp.get('slug') || '')
  if (!brand?.enabled || !brand.logoUrl) return NextResponse.redirect(new URL('/lumio-favicon-64.png', req.url), 302)

  // The renderer reads PNG and JPEG. Anything else (SVG, WebP) goes out as the
  // uploaded file itself — still their logo, just not squared up.
  if (!/^data:image\/(png|jpe?g);base64,/i.test(brand.logoUrl)) {
    return NextResponse.redirect(new URL(`/api/coach/brand-logo?slug=${encodeURIComponent(brand.slug)}`, req.url), 302)
  }

  const homeScreen = size >= 180
  const bg = brand.theme === 'dark' ? '#07080F' : '#FFFFFF'
  const pad = homeScreen ? Math.round(size * 0.14) : 0
  const img = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: homeScreen ? bg : 'transparent', padding: pad }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
    ),
    { width: size, height: size },
  )
  // The URL carries a version of the logo (?v=), so a new upload is a new
  // address and a long cache is safe.
  img.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return img
}
