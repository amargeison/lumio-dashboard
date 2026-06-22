import { NextRequest, NextResponse } from 'next/server'
import { upsertConnection, sessionCoachId } from '@/lib/coach/oauth'

// iCloud has no OAuth. The coach generates an app-specific password at
// appleid.apple.com and pastes it here with their Apple ID; we store it for
// CalDAV (calendar) + SMTP (send-as). Live validation against iCloud CalDAV is a
// follow-up — for now we store the credentials so the sync engine can use them.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { appleId, appPassword } = (await req.json().catch(() => ({}))) as { appleId?: string; appPassword?: string }
  if (!appleId?.trim() || !appPassword?.trim()) {
    return NextResponse.json({ error: 'Apple ID and an app-specific password are required' }, { status: 400 })
  }

  const { error } = await upsertConnection(coachId, {
    provider: 'icloud',
    email_address: appleId.trim(),
    app_password: appPassword.trim(),
    caldav_url: 'https://caldav.icloud.com',
    capabilities: ['calendar', 'send_email'],
    status: 'connected',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
