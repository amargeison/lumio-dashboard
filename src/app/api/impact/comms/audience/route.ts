import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { AUDIENCE_LABELS, HIDDEN_AUDIENCES, NEEDS_ID, audienceMembers, audienceName, parseAudience, reachability, reachLine, skipReason, type Audience, type AudienceKind } from '@/lib/impact/audiences'
import { loadAudienceData, ukToday } from '@/lib/impact/comms-server'
import type { CommsChannel } from '@/lib/impact/comms-rules'

export const runtime = 'nodejs'

// Who an audience is and how many of them can be reached, for the newsletter wizard
// ("N of M reachable — X have no consent, Y unsubscribed, Z no email") and the
// Audiences tab. Runs as the HQ's own session, so RLS applies on top of the hq_id
// filters. Names only — no addresses go back to the browser.
//
//   { audience: { kind, id? }, channel? }  → that audience: counts, the line, and who
//   { all: true, channel? }                → every audience (each school and venue too): counts

export async function POST(req: NextRequest) {
  const auth = await impactHq('see audiences')
  if (auth instanceof NextResponse) return auth
  const { db, hqId } = auth
  const raw = (await req.json().catch(() => ({}))) as { audience?: unknown; all?: unknown; channel?: unknown }
  const channel: CommsChannel = raw.channel === 'sms' || raw.channel === 'app' ? raw.channel : 'email'
  let data
  try { data = await loadAudienceData(db, hqId) } catch (e) {
    console.error('[impact/comms/audience]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Your family records couldn’t be read just now. Please try again.' }, { status: 503 })
  }
  const today = ukToday()
  const summary = (a: Audience) => {
    const members = audienceMembers(a, data, today)
    const reach = reachability(members, channel)
    const { reachableIds: _ids, ...counts } = reach
    return { audience: a, name: audienceName(a, data), line: reachLine(reach, channel), ...counts }
  }
  if (raw.all === true) {
    const list: Audience[] = (Object.keys(AUDIENCE_LABELS) as AudienceKind[]).filter(k => !HIDDEN_AUDIENCES.includes(k)).flatMap((kind): Audience[] =>
      kind === 'school' ? (data.schools ?? []).map(s => ({ kind, id: s.id })) : kind === 'venue' ? (data.venues ?? []).map(v => ({ kind, id: v.id })) : NEEDS_ID.includes(kind) ? [] : [{ kind, id: null }])
    return NextResponse.json({ audiences: list.map(summary), schools: data.schools, venues: data.venues })
  }
  const a = parseAudience(raw.audience)
  if (!a) return NextResponse.json({ error: 'Choose who this is for.' }, { status: 400 })
  const members = audienceMembers(a, data, today)
  return NextResponse.json({
    ...summary(a),
    people: members.slice(0, 500).map(f => ({ id: f.id, name: f.guardian_name, reason: skipReason(f, channel) })),
    schools: data.schools, venues: data.venues,
  })
}
