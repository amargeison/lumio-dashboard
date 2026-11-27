import { NextRequest, NextResponse } from 'next/server'
import { serviceDb } from '@/lib/impact/invite-send'
import { logoKind } from '@/lib/impact/logo'

export const runtime = 'nodejs'

// An org's uploaded logo, for the portal, the sign-up page and emails. Public, like any
// logo: it serves only the file the org's settings point at, never a path from the URL.

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return new NextResponse('Not found', { status: 404 })
  const db = serviceDb()
  const { data: org } = await db.from('impact_orgs').select('hq_id, settings').eq('slug', slug).maybeSingle()
  const path = org?.settings?.logoPath as string | undefined
  if (!org || !path || !path.startsWith(`${org.hq_id}/`)) return new NextResponse('Not found', { status: 404 })
  const { data, error } = await db.storage.from('impact-org-assets').download(path)
  if (error || !data) return new NextResponse('Not found', { status: 404 })
  const bytes = new Uint8Array(await data.arrayBuffer())
  const kind = logoKind(bytes)
  if (!kind) return new NextResponse('Not found', { status: 404 })
  return new NextResponse(bytes, { headers: { 'Content-Type': kind.type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } })
}
