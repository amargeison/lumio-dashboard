import { NextRequest, NextResponse } from 'next/server'
import { upsertConnection, sessionCoachId } from '@/lib/coach/oauth'
import { icloudDiscoverCalendar } from '@/lib/coach/caldav'

// iCloud has no OAuth. The coach generates an app-specific password at
// appleid.apple.com and pastes it here with their Apple ID. We validate the
// credentials against iCloud CalDAV (which also resolves their calendar
// collection URL) and store both so the sync engine can push/pull events.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { appleId, appPassword } = (await req.json().catch(() => ({}))) as { appleId?: string; appPassword?: string }
  if (!appleId?.trim() || !appPassword?.trim()) {
    return NextResponse.json({ error: 'Apple ID and an app-specific password are required' }, { status: 400 })
  }

  // Validate the credentials by resolving the coach's calendar over CalDAV.
  let calendarUrl: string | null = null
  try {
    calendarUrl = await icloudDiscoverCalendar(appleId.trim(), appPassword.trim())
  } catch {
    return NextResponse.json({ error: 'Could not reach iCloud. Please try again.' }, { status: 502 })
  }
  if (!calendarUrl) {
    return NextResponse.json({
      error: 'Could not sign in to iCloud. Check your Apple ID and that this is an app-specific password (create one at appleid.apple.com), not your normal password.',
    }, { status: 400 })
  }

  const { error } = await upsertConnection(coachId, {
    provider: 'icloud',
    email_address: appleId.trim(),
    app_password: appPassword.trim(),
    caldav_url: calendarUrl,   // resolved calendar collection URL (per-user pod)
    capabilities: ['calendar', 'send_email'],   // send_email via iCloud SMTP (same app password)
    status: 'connected',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
