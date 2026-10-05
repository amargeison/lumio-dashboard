import { NextResponse } from 'next/server'
import { getMemberships, playerAppOn, scopedDb } from '@/lib/coach/membership'
import { partnerBrandByCoach } from '@/lib/coach/partner-login'

export const runtime = 'nodejs'

// Who is the signed-in portal user, and whose pages may they open?
//
// A parent can hold several memberships — one per child, at one academy or
// more — so the answer is a LIST: `players`, each with the academy it belongs
// to. The page shows a picker when there is more than one. The list is only a
// menu: every data route checks again that the caller holds an active
// membership for the player it is asked about.
//
// 200 with the list (or role 'coach' for somebody who is only a coach), or 403
// with a `code` saying why there is nothing to show:
//   none    — this address has no access (never invited, or the player it was
//             for has been removed from the roster)
//   revoked — the academy has withdrawn their access
//   app_off — the academy has switched its player app off
export async function GET() {
  const mine = await getMemberships()
  if (!mine) return NextResponse.json({ error: 'Not signed in', code: 'signed_out' }, { status: 401 })
  const db = scopedDb()

  const family = mine.active.filter(m => (m.role === 'parent' || m.role === 'student') && !!m.scopePlayerId)
  const coach = mine.active.find(m => m.role === 'coach') || null
  const academyIds = [...new Set([...family, ...mine.revoked].map(m => m.academyId))]

  const [{ data: playerRows }, { data: academyRows }] = await Promise.all([
    family.length
      ? db.from('coach_players').select('id, coach_id, name').in('id', family.map(m => m.scopePlayerId as string))
      : Promise.resolve({ data: [] as { id: string; coach_id: string; name: string }[] }),
    academyIds.length
      ? db.from('sports_profiles').select('id, brand_name').in('id', academyIds)
      : Promise.resolve({ data: [] as { id: string; brand_name: string | null }[] }),
  ])
  const academyName = (id: string) => String((academyRows || []).find(a => a.id === id)?.brand_name || '').trim() || 'your academy'

  // Per academy, once: is its player app on, and does it have its own badge?
  // And its look, so the family's page carries the academy's own name, logo and
  // colour rather than Lumio's. Those three things and nothing else from the
  // academy's settings. The logo is given as the public logo address (the same
  // one its emails use), never as the stored file.
  type Look = { name: string; logoUrl: string | null; accent: string }
  const perAcademy = new Map<string, { on: boolean; brand: { name: string; iconUrl: string } | null; look: Look | null }>()
  for (const id of new Set(family.map(m => m.academyId))) {
    const [on, brand] = await Promise.all([playerAppOn(db, id), partnerBrandByCoach(id).catch(() => null)])
    const named = String((academyRows || []).find(a => a.id === id)?.brand_name || '').trim()
    perAcademy.set(id, {
      on, brand: brand?.iconUrl ? { name: brand.name, iconUrl: brand.iconUrl } : null,
      look: brand ? {
        name: named,
        logoUrl: brand.logoUrl && brand.slug ? `/api/coach/brand-logo?slug=${encodeURIComponent(brand.slug)}&v=${brand.logoUrl.length}` : null,
        accent: brand.accent,
      } : null,
    })
  }

  const players = family.flatMap(m => {
    // The player must still exist AND belong to the academy the membership is
    // for — the same two conditions the data route applies.
    const p = (playerRows || []).find(x => x.id === m.scopePlayerId && x.coach_id === m.academyId)
    if (!p || !perAcademy.get(m.academyId)?.on) return []
    return [{
      playerId: p.id as string, name: String(p.name || '').trim() || 'Player', role: m.role,
      academyId: m.academyId, academyName: academyName(m.academyId),
      brand: perAcademy.get(m.academyId)?.brand ?? null,
      look: perAcademy.get(m.academyId)?.look ?? null,
    }]
  }).sort((a, b) => a.academyName.localeCompare(b.academyName) || a.name.localeCompare(b.name))

  if (players.length) {
    return NextResponse.json({
      role: players[0].role, email: mine.email, players,
      // Kept for older copies of the page still open in a browser.
      scopePlayerId: players[0].playerId, scopeCoachName: null, brand: players[0].brand,
    })
  }

  if (coach) {
    const brand = await partnerBrandByCoach(coach.academyId).catch(() => null)
    return NextResponse.json({
      role: 'coach', email: mine.email, players: [], scopePlayerId: null, scopeCoachName: coach.scopeCoachName,
      brand: brand?.iconUrl ? { name: brand.name, iconUrl: brand.iconUrl } : null,
    })
  }

  const off = family.find(m => perAcademy.get(m.academyId)?.on === false)
  if (off) return NextResponse.json({ error: 'The player app is switched off', code: 'app_off', academyName: academyName(off.academyId) }, { status: 403 })
  if (mine.revoked.length) return NextResponse.json({ error: 'Access removed', code: 'revoked', academyName: academyName(mine.revoked[0].academyId) }, { status: 403 })
  return NextResponse.json({ error: 'No portal access for this account', code: 'none' }, { status: 403 })
}
