import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'
import { buildExport, emailExport } from '@/lib/impact/export-server'
import { exportAllowed } from '@/lib/impact/exports'
import { brandFor } from '@/lib/impact/org'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'
export const maxDuration = 120

// Settings → Data → "Export everything". HQ or an admin of the org only (impactHq). The
// link goes to the signed-in user's own sign-in email; nothing in the request can change
// where it goes, and the body is not read at all.

export async function POST(req: NextRequest) {
  const who = await impactHq('export your organisation’s data')
  if (who instanceof NextResponse) return who
  const to = (who.user.email ?? '').trim()
  if (!to) return NextResponse.json({ error: 'Your login has no email address, so the export link can’t be sent to you.' }, { status: 400 })

  const db = serviceDb()
  const { data: org } = await db.from('impact_orgs').select('slug, settings').eq('hq_id', who.hqId).maybeSingle()
  if (!org || org.slug === 'demo') return NextResponse.json({ error: 'This organisation can’t be exported.' }, { status: 404 })
  const { data: recent } = await db.from('impact_exports').select('status, created_at').eq('hq_id', who.hqId).order('created_at', { ascending: false }).limit(20)
  const allowed = exportAllowed(recent ?? [], new Date())
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 429 })

  const name = brandFor(org.slug as string, org.settings ?? {}).org
  const made = await buildExport(db, { hqId: who.hqId, name }, { id: who.user.id, email: to })
  if (!made.ok) return NextResponse.json({ error: made.error }, { status: 500 })
  await db.from('impact_settings_log').insert({ hq_id: who.hqId, actor_id: who.user.id, section: 'data', source: 'server', diff: { export: made.id, rows: Object.values(made.counts).reduce((a, b) => a + b, 0) } })

  const link = `${publicSiteOrigin(new URL(req.url).origin)}/api/impact/settings/export/${made.id}`
  const sent = await emailExport({ slug: org.slug as string, org: name, to, link, expiresAt: made.expiresAt })
  if (!sent.ok) return NextResponse.json({ error: sent.error, id: made.id }, { status: 502 })
  const at = to.indexOf('@')
  return NextResponse.json({ ok: true, id: made.id, sentTo: `${to.slice(0, 1)}…${to.slice(at)}`, expiresAt: made.expiresAt, ...(sent.link ? { link: sent.link } : {}) })
}
