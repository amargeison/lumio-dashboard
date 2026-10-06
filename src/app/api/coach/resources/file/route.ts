import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RESOURCE_FILE_PREFIX, RESOURCE_FILE_MAX_MB, RESOURCE_FILE_TOO_BIG } from '@/lib/coach/resource-files'
import { coachSeat } from '@/lib/coach/membership'

export const runtime = 'nodejs'
export const maxDuration = 60

// A head coach's own resource files — upload one (POST), open one (GET), or
// clear away ones no resource uses any more (DELETE).
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
  // Resources belong to the academy, so only its head coach adds files — the
  // head coach of the academy whose portal this came from (coachSeat), not a
  // head coach who is only helping there.
  const seat = await coachSeat(user.id, user.email)
  if (!seat?.isHead) return NextResponse.json({ error: 'Only the head coach can add files to the Resource Centre.' }, { status: 403 })
  const academyId = seat.academyId

  // Checked from the size the browser declares, before the body is read: a
  // request over the limit reaches this route cut short, and reading it then
  // fails in a way that says nothing about size.
  if (Number(req.headers.get('content-length') || 0) > RESOURCE_FILE_MAX_MB * 1048576) return NextResponse.json({ error: RESOURCE_FILE_TOO_BIG }, { status: 413 })
  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'That file did not arrive in one piece. Try again.' }, { status: 400 })
  }
  const file = form.get('file') as File | null
  if (!file || !file.size) return NextResponse.json({ error: 'No file chosen.' }, { status: 400 })
  if (file.size > RESOURCE_FILE_MAX_MB * 1048576) return NextResponse.json({ error: RESOURCE_FILE_TOO_BIG }, { status: 413 })
  const ext = (/\.([a-z0-9]+)$/i.exec(file.name || '')?.[1] || '').toLowerCase()
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: 'That type of file can’t be added — use a PDF, Word, PowerPoint, Excel or image file.' }, { status: 400 })

  // Storage names are plain letters and digits. Accented letters are kept as
  // their plain letter ("Fiche d'exercice é ü" → "Fiche-d-exercice-e-u") rather
  // than dropped, which used to leave "Fiche-d-exercice". A name with no Latin
  // letters at all still becomes "file" — the resource's own title is its label.
  const base = (file.name || `file.${ext}`).replace(/\.[a-z0-9]+$/i, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file'
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
    const { data: prev } = await db.from('coach_resources').select('url, format').eq('id', resourceId).eq('coach_id', academyId).maybeSingle()
    // A document attached to a card that was labelled "Video" is not a video:
    // the label follows the file, as it already does in the full form.
    const format = prev?.format === 'Video' ? { format: ext === 'pdf' ? 'PDF' : 'Worksheet' } : {}
    const { error } = await db.from('coach_resources').update({ url, ...format }).eq('id', resourceId).eq('coach_id', academyId)
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

// Remove uploaded files that no resource points at any more.
//
// Deleting a resource, taking the file off it, or cancelling the form after
// uploading used to leave the file in storage for good — still downloadable by
// anyone in the academy who had the address. The browser now sends the files it
// believes are finished with; this route decides. A file is removed ONLY if it
// is in the caller's own academy folder and no resource row still uses it, so a
// wrong or stale request cannot take a file out from under a live resource.
export async function DELETE(req: NextRequest) {
  const user = await signedInUser()
  if (!user) return NextResponse.json({ error: 'You are signed out — sign in again.' }, { status: 401 })
  const db = admin()
  const seat = await coachSeat(user.id, user.email)
  if (!seat?.isHead) return NextResponse.json({ error: 'Only the head coach can remove files from the Resource Centre.' }, { status: 403 })
  const academyId = seat.academyId

  const body = (await req.json().catch(() => ({}))) as { paths?: unknown }
  const asked = Array.isArray(body.paths) ? body.paths.slice(0, 500) : []
  // Their own folder only; anything else in the list is ignored, not an error.
  const mine = [...new Set(asked.filter((p): p is string => typeof p === 'string' && PATH_RE.exec(p)?.[1] === academyId))]
  if (!mine.length) return NextResponse.json({ removed: 0, kept: 0 })

  const { data: used, error } = await db.from('coach_resources').select('url')
    .eq('coach_id', academyId).in('url', mine.map(p => `${RESOURCE_FILE_PREFIX}${p}`))
  // Cannot tell what is still in use: remove nothing.
  if (error) return NextResponse.json({ error: 'Could not check which files are still in use.' }, { status: 500 })
  const inUse = new Set(((used ?? []) as { url: string }[]).map(r => r.url.slice(RESOURCE_FILE_PREFIX.length)))
  const spare = mine.filter(p => !inUse.has(p))
  if (spare.length) {
    const rm = await db.storage.from('coach-media').remove(spare)
    if (rm.error) {
      console.error('[coach/resources/file] remove', rm.error.message)
      return NextResponse.json({ error: 'Those files could not be removed. Try again.' }, { status: 500 })
    }
  }
  return NextResponse.json({ removed: spare.length, kept: mine.length - spare.length })
}
