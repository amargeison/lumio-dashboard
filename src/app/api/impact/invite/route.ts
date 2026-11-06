import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { impactHq } from '@/lib/impact/import-auth'
import { invitesLeft } from '@/lib/impact/invites'
import { invitesOn, sendInvite, sentThisHour, serviceDb, type InviteTarget, type OrgForInvite } from '@/lib/impact/invite-send'

export const dynamic = 'force-dynamic'

const looksLikeEmail = (s: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s)
const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

type Family = { id: string; email: string | null; unsubscribed_at: string | null }

/** Why this family can't be invited, or null. Invites are transactional, so an email opt-out doesn't stop one; an unsubscribe does. */
const familyProblem = (f: Family) =>
  !looksLikeEmail((f.email ?? '').trim()) ? 'There’s no usable email address on this family.'
  : f.unsubscribed_at ? 'This family has unsubscribed, so no invite was sent.'
  : null

async function hasLogin(admin: SupabaseClient, hqId: string, col: 'family_id' | 'staff_id', id: string) {
  const { data } = await admin.from('impact_members').select('id').eq('hq_id', hqId).eq(col, id).not('accepted_at', 'is', null).is('revoked_at', null).limit(1)
  return !!data?.length
}

async function orgOf(db: SupabaseClient, userId: string): Promise<OrgForInvite | null> {
  const { data } = await db.from('impact_orgs').select('slug, settings').eq('hq_id', userId).maybeSingle()
  if (!data) return null
  const name = String((data.settings as { org?: string } | null)?.org ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80)
  return { hqId: userId, userId, slug: data.slug as string, name: name || 'Lumio Impact' }
}

export async function POST(req: NextRequest) {
  const auth = await impactHq('invite people')
  if (auth instanceof NextResponse) return auth
  const { user, db } = auth
  const org = await orgOf(db, user.id)
  if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  if (!invitesOn()) return NextResponse.json({ error: 'Invites aren’t switched on yet.' }, { status: 503 })
  const admin = serviceDb()
  const raw = (await req.json().catch(() => ({}))) as { role?: unknown; targetId?: unknown; bulk?: unknown }

  // Every family with an email and no login, up to what's left of this hour.
  if (raw.bulk === true) {
    const [{ data: families, error }, { data: members }, { data: waiting }] = await Promise.all([
      db.from('tp_families').select('id, email, unsubscribed_at').eq('hq_id', org.hqId),
      admin.from('impact_members').select('family_id').eq('hq_id', org.hqId).eq('role', 'parent').not('accepted_at', 'is', null).is('revoked_at', null),
      admin.from('impact_invites').select('family_id').eq('hq_id', org.hqId).eq('role', 'parent').is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString()),
    ])
    if (error) return NextResponse.json({ error: 'The families could not be read.' }, { status: 500 })
    const taken = new Set([...(members ?? []), ...(waiting ?? [])].map(m => m.family_id))
    const eligible = ((families ?? []) as Family[]).filter(f => !familyProblem(f) && !taken.has(f.id))
    const batch = eligible.slice(0, invitesLeft(await sentThisHour(admin, org.hqId)))
    let sent = 0, failed = 0
    const links: string[] = []
    for (const f of batch) {
      const r = await sendInvite(admin, org, { role: 'parent', familyId: f.id, email: f.email ?? '' })
      if (r.ok) { sent++; if (r.link) links.push(r.link) } else failed++
    }
    return NextResponse.json({ sent, failed, left: eligible.length - batch.length, ...(links.length ? { links } : {}) })
  }

  if (!isUuid(raw.targetId)) return NextResponse.json({ error: 'Choose who to invite first.' }, { status: 400 })
  let target: InviteTarget
  if (raw.role === 'parent') {
    // Read as the HQ, so another org's family simply isn't found.
    const { data: f } = await db.from('tp_families').select('id, email, unsubscribed_at').eq('id', raw.targetId).eq('hq_id', org.hqId).maybeSingle()
    if (!f) return NextResponse.json({ error: 'That family could not be found.' }, { status: 404 })
    const problem = familyProblem(f as Family)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    if (await hasLogin(admin, org.hqId, 'family_id', f.id)) return NextResponse.json({ error: 'This family already has a login.' }, { status: 409 })
    target = { role: 'parent', familyId: f.id, email: f.email as string }
  } else if (raw.role === 'coach') {
    const { data: s } = await db.from('tp_staff').select('id, email').eq('id', raw.targetId).eq('hq_id', org.hqId).maybeSingle()
    if (!s) return NextResponse.json({ error: 'That coach could not be found.' }, { status: 404 })
    if (!looksLikeEmail((s.email ?? '').trim())) return NextResponse.json({ error: 'There’s no usable email address for this coach.' }, { status: 400 })
    if (await hasLogin(admin, org.hqId, 'staff_id', s.id)) return NextResponse.json({ error: 'This coach already has a login.' }, { status: 409 })
    target = { role: 'coach', staffId: s.id, email: s.email as string }
  } else {
    return NextResponse.json({ error: 'Choose who to invite first.' }, { status: 400 })
  }
  const r = await sendInvite(admin, org, target)
  return r.ok ? NextResponse.json({ ok: true, ...(r.link ? { link: r.link } : {}) }) : NextResponse.json({ error: r.error }, { status: r.status })
}
