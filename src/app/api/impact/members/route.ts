import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { sendInvite, serviceDb } from '@/lib/impact/invite-send'

export const dynamic = 'force-dynamic'

const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

// Settings → People. Members and invites are closed to browser writes, so the HQ's
// Revoke and Resend invite come through here, always limited to its own org.
export async function POST(req: NextRequest) {
  const auth = await impactHq('manage logins')
  if (auth instanceof NextResponse) return auth
  const { user, db } = auth
  const { data: org } = await db.from('impact_orgs').select('slug, settings').eq('hq_id', user.id).maybeSingle()
  if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  const admin = serviceDb()
  const { action, memberId, inviteId } = (await req.json().catch(() => ({}))) as { action?: unknown; memberId?: unknown; inviteId?: unknown }
  const now = new Date().toISOString()

  if (action === 'revoke') {
    if (!isUuid(memberId) && !isUuid(inviteId)) return NextResponse.json({ error: 'Choose who to revoke first.' }, { status: 400 })
    if (isUuid(memberId)) {
      const { data, error } = await admin.from('impact_members').update({ revoked_at: now }).eq('id', memberId).eq('hq_id', user.id).select('id')
      if (error || !data?.length) return NextResponse.json({ error: 'That login could not be found.' }, { status: 404 })
    }
    if (isUuid(inviteId)) {
      const { data, error } = await admin.from('impact_invites').update({ revoked_at: now }).eq('id', inviteId).eq('hq_id', user.id).is('accepted_at', null).select('id')
      if (error || (!data?.length && !isUuid(memberId))) return NextResponse.json({ error: 'That invite could not be found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'resend') {
    if (!isUuid(inviteId)) return NextResponse.json({ error: 'Choose an invite first.' }, { status: 400 })
    const { data: i } = await admin.from('impact_invites').select('role, staff_id, family_id, email, accepted_at').eq('id', inviteId).eq('hq_id', user.id).maybeSingle()
    if (!i || i.accepted_at || (i.role !== 'parent' && i.role !== 'coach')) return NextResponse.json({ error: 'That invite could not be found.' }, { status: 404 })
    const name = String((org.settings as { org?: string } | null)?.org ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80) || 'Lumio Impact'
    const r = await sendInvite(admin, { hqId: user.id, userId: user.id, slug: org.slug as string, name }, { role: i.role, staffId: i.staff_id ?? undefined, familyId: i.family_id ?? undefined, email: i.email as string })
    return r.ok ? NextResponse.json({ ok: true, ...(r.link ? { link: r.link } : {}) }) : NextResponse.json({ error: r.error }, { status: r.status })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
