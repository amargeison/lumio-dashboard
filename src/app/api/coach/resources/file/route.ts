import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RESOURCE_FILE_PREFIX, RESOURCE_FILE_MAX_MB } from '@/lib/coach/resource-files'

export const runtime = 'nodejs'
export const maxDuration = 60

// A head coach's own resource files — upload one (POST), or open one (GET).
//
// Files live in the private coach-media bucket under <academyId>/resources/,
// and the resource row stores "file:<that path>". Opening one checks that the
// signed-in person belongs to that academy — the head coach, one of their
// coaches, or a player/parent with app access — then hands them a link that
// works for five minutes. Nobody outside the academy can open a club's files,
// even with the address.

const ALLOWED = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'txt'])
const PATH_RE = /^([0-9a-f-]{36})\/resources\/[A-Za-z0-9._-]{1,160}$/

async function signedInUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || ''
  const m = PATH_RE.exec(path)
  if (!m) return new NextResponse('Not found', { status: 404 })
  const academyId = m[1]
  const user = await signedInUser()
  if (!user) return NextResponse.redirect(new URL(`/sports-login?redirectTo=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.url))

  const db = admin()
  let allowed = user.id === academyId
  if (!allowed) {
    const { data } = await db.from('coach_members').select('id')
      .eq('academy_id', academyId).eq('member_user_id', user.id).eq('status', 'active').limit(1)
    allowed = !!(data && data.length)
  }
  if (!allowed) return new NextResponse('Not found', { status: 404 })

  const { data, error } = await db.storage.from('coach-media').createSignedUrl(path, 300)
  if (error || !data?.signedUrl) return new NextResponse('This file is no longer available.', { status: 404 })
  return NextResponse.redirect(data.signedUrl, 302)
}

export async function POST(req: NextRequest) {
  const user = await signedInUser()
  if (!user) return NextResponse.json({ error: 'You are signed out — sign in again.' }, { status: 401 })
  const db = admin()
  // Resources belong to the academy, so only its head coach adds files.
  const { data: own } = await db.from('sports_profiles').select('id, sport').eq('id', user.id).maybeSingle()
  if (own?.sport !== 'coach') return NextResponse.json({ error: 'Only the head coach can add files to the Resource Centre.' }, { status: 403 })
  const academyId = user.id

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: `That file is too big — the limit is ${RESOURCE_FILE_MAX_MB}MB.` }, { status: 413 })
  }
  const file = form.get('file') as File | null
  if (!file || !file.size) return NextResponse.json({ error: 'No file chosen.' }, { status: 400 })
  if (file.size > RESOURCE_FILE_MAX_MB * 1048576) return NextResponse.json({ error: `That file is too big — the limit is ${RESOURCE_FILE_MAX_MB}MB.` }, { status: 413 })
  const ext = (/\.([a-z0-9]+)$/i.exec(file.name || '')?.[1] || '').toLowerCase()
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: 'That type of file can’t be added — use a PDF, Word, PowerPoint, Excel or image file.' }, { status: 400 })

  const base = (file.name || `file.${ext}`).replace(/\.[a-z0-9]+$/i, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file'
  const path = `${academyId}/resources/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const up = await db.storage.from('coach-media').upload(path, buf, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (up.error) {
    console.error('[coach/resources/file] upload', up.error.message)
    return NextResponse.json({ error: 'Could not upload that file — try again.' }, { status: 500 })
  }
  const url = `${RESOURCE_FILE_PREFIX}${path}`

  // Attach straight to an existing resource when asked, replacing (and
  // tidying away) any file it had before.
  const resourceId = String(form.get('resourceId') || '').trim()
  if (resourceId) {
    const { data: prev } = await db.from('coach_resources').select('url').eq('id', resourceId).eq('coach_id', academyId).maybeSingle()
    const { error } = await db.from('coach_resources').update({ url }).eq('id', resourceId).eq('coach_id', academyId)
    if (error) {
      await db.storage.from('coach-media').remove([path]).catch(() => {})
      return NextResponse.json({ error: 'Could not attach the file to that resource.' }, { status: 500 })
    }
    const old = String(prev?.url || '')
    if (old.startsWith(`${RESOURCE_FILE_PREFIX}${academyId}/resources/`)) {
      await db.storage.from('coach-media').remove([old.slice(RESOURCE_FILE_PREFIX.length)]).catch(() => {})
    }
  }
  return NextResponse.json({ url })
}
