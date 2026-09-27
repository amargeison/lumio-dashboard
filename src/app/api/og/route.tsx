import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'

export const runtime = 'nodejs'

// The picture a pasted link shows — Trello, WhatsApp, Slack, LinkedIn, iMessage.
//
// Those apps show og:image at full width. Handing them a bare logo meant a
// square club badge blown up to fill the card, and no words at all, because most
// of them drop the description once there is an image. So the image IS the
// preview: a 1200×630 card with the logos kept small and the sentence that says
// what the link is.
//
// Text comes only from the academy's own name or from the fixed presets below —
// never from the query string — so nobody can mint an image on our domain that
// says whatever they like.

const PRESETS: Record<string, { title: string; sub: string }> = {
  'tennis-coach': { title: 'Lumio Tennis Coach', sub: 'Bookings, session plans, lesson summaries, player progress, camps and parent messaging — for tennis coaches and academies.' },
  sports: { title: 'Lumio Sports', sub: 'The business side of sport, run in one place — for coaches, clubs, academies and athletes.' },
  signin: { title: 'Sign in to Lumio', sub: 'Your email and a one-time code. No password needed.' },
  player: { title: 'Your coaching', sub: 'Sessions, lesson summaries, progress and messages from your coach.' },
}

async function lumioLogo(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'tennis_coach_logo_on_dark.png'))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const slug = sp.get('slug') || ''
  const view = sp.get('v') === 'login' ? 'login' : 'portal'
  const brand = slug ? await partnerBrandBySlug(slug) : null

  let title: string
  let sub: string
  if (brand) {
    title = view === 'login' ? `Sign in to ${brand.name}` : `${brand.name} portal`
    sub = view === 'login'
      ? 'Sessions, lesson summaries, progress and messages from your coach.'
      : 'Bookings, session plans, lesson summaries, player progress, camps and messages.'
  } else {
    const p = PRESETS[sp.get('page') || ''] || PRESETS['tennis-coach']
    title = p.title
    sub = p.sub
  }
  // A logo only a partner has uploaded, and only in a format the renderer reads.
  const partnerLogo = brand?.logoUrl && /^data:image\/(png|jpe?g);base64,/i.test(brand.logoUrl) ? brand.logoUrl : null
  const lumio = await lumioLogo()

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #0A0D15 0%, #121A33 60%, #1B1740 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {partnerLogo && (
            <div style={{ display: 'flex', width: 112, height: 112, borderRadius: 20, background: '#fff', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partnerLogo} alt="" style={{ maxWidth: 92, maxHeight: 92, objectFit: 'contain' }} />
            </div>
          )}
          {partnerLogo && lumio && <div style={{ display: 'flex', width: 2, height: 80, background: 'rgba(255,255,255,0.18)' }} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {lumio && <img src={lumio} alt="" width={230} height={100} style={{ objectFit: 'contain' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 64, lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 1000 }}>{title}</div>
          {brand && <div style={{ display: 'flex', fontSize: 30, color: '#A9B4FF', marginTop: 14 }}>Running on Lumio Tennis Coach</div>}
          <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.4, color: 'rgba(255,255,255,0.62)', marginTop: 18, maxWidth: 980 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', height: 8, width: 150, borderRadius: 4, background: 'linear-gradient(90deg, #8B5CF6, #3A8EE0)' }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  )
}
