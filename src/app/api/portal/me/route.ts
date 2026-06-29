import { NextResponse } from 'next/server'
import { getMembership } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Who is the signed-in portal user? Resolves (and binds) their membership.
// 200 with the scoped role, or 403 if they're signed in but not a member.
export async function GET() {
  const m = await getMembership()
  if (!m) return NextResponse.json({ error: 'No portal access for this account' }, { status: 403 })
  return NextResponse.json({ role: m.role, scopePlayerId: m.scopePlayerId, scopeCoachName: m.scopeCoachName, email: m.email })
}
