import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'
import { logoKind, LOGO_MAX_BYTES } from '@/lib/impact/logo'

export const runtime = 'nodejs'

// Settings → Organisation → Upload logo. PNG, JPEG or WebP up to 2 MB, checked by its
// first bytes (not its name). Stored in the private impact-org-assets bucket. Returns the
// new logo and path; Settings then saves them with the HQ's own session (so the audit log
// names them), and /api/impact/logo/<slug> serves whatever the saved settings point at.

export async function POST(req: NextRequest) {
  const who = await impactHq('change the logo')
  if (who instanceof NextResponse) return who
  if (Number(req.headers.get('content-length') ?? 0) > LOGO_MAX_BYTES + 16 * 1024) return NextResponse.json({ error: 'That image is over 2 MB.' }, { status: 413 })
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length > LOGO_MAX_BYTES) return NextResponse.json({ error: 'That image is over 2 MB.' }, { status: 413 })
  const kind = logoKind(bytes)
  if (!kind) return NextResponse.json({ error: 'Use a PNG, JPEG or WebP image.' }, { status: 415 })

  const { data: org } = await who.db.from('impact_orgs').select('slug, settings').eq('hq_id', who.hqId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  const v = Date.now()
  const path = `${who.hqId}/logo-${v}.${kind.ext}`
  const service = serviceDb()
  const up = await service.storage.from('impact-org-assets').upload(path, bytes, { contentType: kind.type, upsert: false })
  if (up.error) return NextResponse.json({ error: 'The logo couldn’t be uploaded. Please try again.' }, { status: 500 })
  // Earlier uploads that were never saved, or were replaced, go (the saved one stays until the new one is saved).
  const current = (org.settings?.logoPath as string | undefined) ?? null
  const { data: files } = await service.storage.from('impact-org-assets').list(who.hqId, { limit: 100 })
  const stale = (files ?? []).map(f => `${who.hqId}/${f.name}`).filter(p => p !== path && p !== current && /\/logo-\d+\.(png|jpg|webp)$/.test(p))
  if (stale.length) await service.storage.from('impact-org-assets').remove(stale)
  return NextResponse.json({ ok: true, logo: `/api/impact/logo/${org.slug}?v=${v}`, logoPath: path })
}
