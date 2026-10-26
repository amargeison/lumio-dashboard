import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'

// The academy's private address for leads sent in by an automation — Meta lead
// ads through Zapier or Make, a website form, anything that can POST.
//
//   GET   the address, if there is one, and when it was last used
//   POST  make one, or { rotate: true } to replace it (the old one stops working)
//
// Head coach only: the address puts leads into the whole academy.

export async function GET(req: NextRequest) {
  const who = await coachGate({ headOnly: true })
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const { data } = await serviceClient().from('coach_lead_hooks').select('token, last_used_at').eq('coach_id', who.seat.academyId).maybeSingle()
  const origin = publicSiteOrigin(new URL(req.url).origin)
  return NextResponse.json({ url: data ? `${origin}/api/leads/in/${data.token}` : null, lastUsedAt: data?.last_used_at || null })
}

export async function POST(req: NextRequest) {
  const who = await coachGate({ headOnly: true })
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const { rotate } = (await req.json().catch(() => ({}))) as { rotate?: boolean }
  const db = serviceClient()
  const { data: had } = await db.from('coach_lead_hooks').select('token, last_used_at').eq('coach_id', who.seat.academyId).maybeSingle()
  let token = had?.token as string | undefined
  if (!token || rotate) {
    token = randomBytes(18).toString('base64url')
    const { error } = await db.from('coach_lead_hooks').upsert({ coach_id: who.seat.academyId, token, last_used_at: null, created_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: 'The address could not be made. Please try again.' }, { status: 500 })
  }
  const origin = publicSiteOrigin(new URL(req.url).origin)
  return NextResponse.json({ url: `${origin}/api/leads/in/${token}`, lastUsedAt: !rotate && had?.token === token ? had?.last_used_at || null : null })
}
