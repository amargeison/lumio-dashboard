import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'

export const runtime = 'nodejs'

// Settings → Data → Erase a family (GDPR). Off until IMPACT_ERASE=on (it needs migration
// 241). HQ or an admin only. The erase itself runs in the database as the signed-in user
// (impact_erase_family checks their access and logs them). Then each parent login it
// revoked is deleted, through the Supabase admin API, only if impact_user_deletable()
// says nothing else uses it: no other org, no Coach account, nothing.

export async function POST(req: NextRequest) {
  if (process.env.IMPACT_ERASE !== 'on') return NextResponse.json({ error: 'Erasing a family isn’t switched on yet.' }, { status: 503 })
  const who = await impactHq('erase a family')
  if (who instanceof NextResponse) return who
  const body = (await req.json().catch(() => ({}))) as { familyId?: unknown; confirm?: unknown }
  const familyId = typeof body.familyId === 'string' && /^[0-9a-f-]{36}$/i.test(body.familyId) ? body.familyId : null
  if (!familyId) return NextResponse.json({ error: 'Choose a family.' }, { status: 400 })
  if (body.confirm !== 'ERASE') return NextResponse.json({ error: 'Type ERASE to confirm.' }, { status: 400 })

  const { data, error } = await who.db.rpc('impact_erase_family', { p_hq: who.hqId, p_family: familyId })
  if (error) {
    const status = error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : 500
    if (status === 500) console.error('[impact/erase]', error.message)
    return NextResponse.json({ error: status === 404 ? 'That family isn’t in your organisation.' : status === 403 ? 'Only your organisation’s HQ can erase a family.' : 'The family couldn’t be erased. Nothing was changed.' }, { status })
  }
  const out = (data ?? {}) as Record<string, unknown>
  if (out.alreadyErased) return NextResponse.json({ ok: true, alreadyErased: true })
  const { revokedUsers, ...counts } = out as { revokedUsers?: string[] } & Record<string, unknown>

  const service = serviceDb()
  let deleted = 0, kept = 0, failed = 0
  for (const uid of Array.isArray(revokedUsers) ? revokedUsers : []) {
    const { data: ok, error: e } = await service.rpc('impact_user_deletable', { p_user: uid })
    if (e || ok !== true) { kept++; continue }
    const d = await service.auth.admin.deleteUser(uid)
    if (d.error) { failed++; console.error('[impact/erase] login delete failed', d.error.message) } else deleted++
  }
  if (deleted || failed || kept) {
    await service.from('impact_settings_log').insert({ hq_id: who.hqId, actor_id: who.user.id, section: 'data', source: 'server', diff: { erasedFamily: familyId, loginsDeleted: deleted, loginsKept: kept, ...(failed ? { loginDeleteFailed: failed } : {}) } })
  }
  return NextResponse.json({ ok: true, ...counts, loginsDeleted: deleted, loginsKept: kept, ...(failed ? { loginDeleteFailed: failed } : {}) })
}
