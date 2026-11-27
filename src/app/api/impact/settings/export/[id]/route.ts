import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serviceDb } from '@/lib/impact/invite-send'
import { EXPORT_BUCKET } from '@/lib/impact/export-server'

export const runtime = 'nodejs'

// The link in the export email. Works only for the person who asked for the export, while
// they still have HQ or admin access to that org, and only until it expires. Then a
// one-minute signed link to the private file.

const page = (status: number, text: string) => new NextResponse(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Data export</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#111;line-height:1.6"><h1 style="font-size:20px">Data export</h1><p>${text}</p></body>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return page(404, 'That export link isn’t right.')
  const cookieStore = await cookies()
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
  const { data: { user } } = await db.auth.getUser()
  if (!user) {
    const back = encodeURIComponent(new URL(req.url).pathname)
    return page(401, `Please <a href="/sports-login?redirectTo=${back}">sign in to Lumio Impact</a> as yourself, then open the link in the email again.`)
  }
  const service = serviceDb()
  const { data: row } = await service.from('impact_exports').select('hq_id, requested_by, status, path, expires_at').eq('id', id).maybeSingle()
  // Not yours and not found look the same, so the link says nothing about other exports.
  if (!row || row.requested_by !== user.id) return page(404, 'This export link isn’t for this login. Sign in as the person who asked for the export.')
  const { data: allowed } = await db.rpc('impact_hqs_for', { p_role: 'hq' })
  if (!((allowed ?? []) as string[]).includes(row.hq_id as string)) return page(403, 'You no longer have HQ access to this organisation, so the export can’t be downloaded.')
  if (row.status !== 'ready' || !row.path || Date.parse(row.expires_at as string) <= Date.now()) return page(410, 'This export has expired and its file has been deleted. You can make a new one in Settings → Data.')
  const { data: signed, error } = await service.storage.from(EXPORT_BUCKET).createSignedUrl(row.path as string, 60, { download: `export-${String(row.expires_at).slice(0, 10)}.zip` })
  if (error || !signed?.signedUrl) return page(500, 'The file couldn’t be fetched just now. Please try again in a minute.')
  return NextResponse.redirect(signed.signedUrl, { status: 303, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}
