import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { academyMoney } from '@/app/api/coach/pay/_saved'
import { linkFor, sendWelcome, PLAYER_COLS } from '@/lib/coach/welcome-server'

export const runtime = 'nodejs'

// Welcome links, from the coach's side.
//
// POST { playerIds: string[], version: 'short' | 'long', send?: boolean }
//   Makes (or reuses) each player's welcome link and, unless send is false,
//   emails it. With one player and send false, returns the link to copy.

const MAX = 200

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { playerIds?: unknown; version?: string; send?: boolean }
  const ids = Array.isArray(b.playerIds) ? Array.from(new Set(b.playerIds.filter(isUuid))).slice(0, MAX) : []
  if (!ids.length) return NextResponse.json({ error: 'Choose who to send it to.' }, { status: 400 })
  const version = b.version === 'long' ? 'long' : 'short'
  const send = b.send !== false
  const db = serviceClient()
  let q = db.from('coach_players').select(PLAYER_COLS).eq('coach_id', academyId).in('id', ids)
  if (mine) q = q.eq('staff_id', mine)
  const { data: players } = await q
  if (!players?.length) return NextResponse.json({ error: 'We could not find those players.' }, { status: 404 })
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const m = await academyMoney(db, academyId)
  const out = { sent: 0, noEmail: [] as string[], failed: [] as string[], url: null as string | null }
  for (const p of players) {
    const link = await linkFor(db, academyId, p, version)
    if (!link) { out.failed.push(p.name); continue }
    if (!send) { out.url = `${origin}/welcome/${link.token}`; continue }
    const r = await sendWelcome(db, who.userId, m, p, link, origin)
    if (r.ok) out.sent++
    else if (/no email/.test(r.error || '')) out.noEmail.push(p.name)
    else out.failed.push(p.name)
  }
  return NextResponse.json({ ok: true, ...out })
}
