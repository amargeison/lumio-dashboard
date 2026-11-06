import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PDFDocument } from 'pdf-lib'
import { impactHq } from '@/lib/impact/import-auth'
import { BOOKLET_BUCKET, MAX_BOOKLET_PDF_BYTES, SIGNED_URL_SECONDS, bookletPath, isUuid, pdfProblem } from '@/lib/impact/booklet-pdf'

export const runtime = 'nodejs'

// The printed Activity Booklet. The bucket is private with no storage policies, so the
// service key is the only way in, and this route is the only thing that uses it: POST
// for the org's HQ, GET for its HQ, coaches and parents. School logins are left out on
// purpose, which is why the roles are named rather than asking for any membership.

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const refuse = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: NextRequest) {
  const auth = await impactHq('upload the booklet')
  if (auth instanceof NextResponse) return auth
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BOOKLET_PDF_BYTES + 65536) return refuse('That PDF is over the 10 MB limit.', 413)

  let file: File | null = null
  try { file = (await req.formData()).get('file') as File | null } catch { /* handled below */ }
  if (!file || typeof file.arrayBuffer !== 'function') return refuse('Choose a PDF to upload.', 400)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const problem = pdfProblem(bytes.byteLength, file.type, bytes)
  if (problem) return refuse(problem, problem.includes('limit') ? 413 : 400)

  let pages: number
  try { pages = (await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })).getPageCount() }
  catch { return refuse('That PDF couldn’t be read. Try saving it again.', 400) }

  const hq = auth.user.id
  const stored = await admin().storage.from(BOOKLET_BUCKET).upload(bookletPath(hq), bytes, { contentType: 'application/pdf', upsert: true, cacheControl: '60' })
  if (stored.error) {
    console.error('[impact/booklet-pdf] upload failed', stored.error.message)
    return refuse('The PDF couldn’t be stored. Please try again.', 500)
  }
  const details = { pdf_path: bookletPath(hq), pdf_name: file.name.slice(0, 120), pdf_pages: pages, pdf_bytes: bytes.byteLength, pdf_uploaded_at: new Date().toISOString() }
  const { error } = await auth.db.from('tp_booklet').upsert({ hq_id: hq, ...details })
  if (error) {
    console.error('[impact/booklet-pdf] save failed', error.message)
    return refuse('The PDF was stored but its details couldn’t be saved. Please try again.', 500)
  }
  return NextResponse.json(details)
}

export async function GET(req: NextRequest) {
  const hq = req.nextUrl.searchParams.get('hq')
  if (!isUuid(hq)) return refuse('That booklet could not be found.', 400)
  const cookieStore = await cookies()
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
  const { data: { user } } = await db.auth.getUser()
  if (!user) return refuse('Please sign in to open the booklet.', 401)

  const roles = await Promise.all(['hq', 'coach', 'parent'].map(p_role => db.rpc('impact_hqs_for', { p_role })))
  const member = roles.some(r => ((r.data ?? []) as string[]).includes(hq))
  if (!member) return refuse('You don’t have access to this booklet.', 403)

  const service = admin()
  const { data: row } = await service.from('tp_booklet').select('pdf_path').eq('hq_id', hq).maybeSingle()
  if (!row?.pdf_path) return refuse('There’s no PDF for this booklet yet.', 404)
  const { data, error } = await service.storage.from(BOOKLET_BUCKET).createSignedUrl(bookletPath(hq), SIGNED_URL_SECONDS)
  if (error || !data) {
    console.error('[impact/booklet-pdf] sign failed', error?.message)
    return refuse('The booklet couldn’t be opened. Please try again.', 500)
  }
  return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
}
