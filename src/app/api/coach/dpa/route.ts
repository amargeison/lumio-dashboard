import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { DPA_VERSION, dpaText } from '@/lib/coach/dpa'

export const runtime = 'nodejs'

// The academy's data processing agreement with Lumio.
//
//   GET   the latest acceptance (which version, who, when)
//   POST  { name, agree: true }  accept the current version. The exact words
//         accepted are kept with the acceptance, so a later change to the
//         agreement never changes what was agreed. Head coach only: it is the
//         academy's agreement.

export async function GET() {
  const who = await coachGate({ headOnly: true })
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const { data } = await serviceClient().from('coach_dpa_acceptances').select('version, accepted_by, accepted_at')
    .eq('coach_id', who.seat.academyId).order('accepted_at', { ascending: false }).limit(1)
  const last = data?.[0] || null
  return NextResponse.json({ version: DPA_VERSION, accepted: last, current: !!last && last.version === DPA_VERSION })
}

export async function POST(req: NextRequest) {
  const who = await coachGate({ headOnly: true })
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const b = (await req.json().catch(() => ({}))) as { name?: string; agree?: boolean }
  const name = String(b.name || '').trim().slice(0, 80)
  if (b.agree !== true) return NextResponse.json({ error: 'Tick the box to accept the agreement.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Type your full name.' }, { status: 400 })
  const db = serviceClient()
  const academyId = who.seat.academyId
  const { data: prof } = await db.from('sports_profiles').select('brand_name, display_name').eq('id', academyId).maybeSingle()
  const academy = (prof?.brand_name as string) || (prof?.display_name as string) || 'The academy'
  const now = new Date().toISOString()
  const { error } = await db.from('coach_dpa_acceptances').insert({ coach_id: academyId, version: DPA_VERSION, accepted_by: name, accepted_at: now, text: dpaText(academy) })
  if (error) return NextResponse.json({ error: 'That could not be saved. Please try again.' }, { status: 500 })
  // The older flag the portal already shows.
  await db.from('sports_profiles').update({ dpa_accepted_at: now }).eq('id', academyId)
  return NextResponse.json({ ok: true, version: DPA_VERSION, accepted: { version: DPA_VERSION, accepted_by: name, accepted_at: now }, current: true })
}
