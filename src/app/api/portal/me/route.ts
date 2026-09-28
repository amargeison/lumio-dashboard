import { NextResponse } from 'next/server'
import { getMembership } from '@/lib/coach/membership'
import { partnerBrandByCoach } from '@/lib/coach/partner-login'

export const runtime = 'nodejs'

// Who is the signed-in portal user? Resolves (and binds) their membership.
// 200 with the scoped role, or 403 if they're signed in but not a member.
export async function GET() {
  const m = await getMembership()
  if (!m) return NextResponse.json({ error: 'No portal access for this account' }, { status: 403 })
  // The academy's own badge for the tab and home screen, when it has switched
  // its partner sign-in page on and uploaded a logo. Null → Lumio's stays.
  const brand = m.academyId ? await partnerBrandByCoach(m.academyId) : null
  return NextResponse.json({
    role: m.role, scopePlayerId: m.scopePlayerId, scopeCoachName: m.scopeCoachName, email: m.email,
    brand: brand?.iconUrl ? { name: brand.name, iconUrl: brand.iconUrl } : null,
  })
}
