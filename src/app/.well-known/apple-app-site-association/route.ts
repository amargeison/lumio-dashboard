import { NextResponse } from 'next/server'
import { APP_BUNDLE_ID } from '@/lib/app/apns'

// Tells iPhones which www.lumiosports.com links open in the Lumio Tennis Coach
// app when it is installed (Apple fetches this file; it must not redirect).
// Without the app, the same links open in Safari exactly as before.
//
// Needs APPLE_TEAM_ID (or APNS_TEAM_ID) on the server; until then: not found.

// Read at request time, so setting the team ID needs no rebuild.
export const dynamic = 'force-dynamic'

export function GET() {
  const team = process.env.APPLE_TEAM_ID || process.env.APNS_TEAM_ID
  if (!team || !/^[A-Z0-9]{10}$/.test(team)) return new NextResponse('Not found', { status: 404 })
  const body = {
    applinks: {
      details: [{
        appIDs: [`${team}.${APP_BUNDLE_ID}`],
        components: [
          { '/': '/app', comment: 'The app start' },
          { '/': '/app/*' },
          { '/': '/portal', comment: 'A family’s own page' },
          { '/': '/portal/*' },
          { '/': '/lesson/*', comment: 'I’ll be there / can’t make it, from the reminder' },
          { '/': '/group/*', comment: 'Coming this week?' },
          { '/': '/slot/*', comment: 'A free slot offered' },
          { '/': '/tennis/coach/*', comment: 'A coach’s portal' },
        ],
      }],
    },
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
