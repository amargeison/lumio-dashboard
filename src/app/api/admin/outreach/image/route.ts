import { NextRequest, NextResponse } from 'next/server'
import { adminFor, db } from '@/lib/outreach/core'

export const runtime = 'nodejs'

// Upload a picture for a designed outreach email. Signed-in admins only; the
// file goes into the public "outreach" bucket (an email client must be able to
// fetch it) under a random name, and the public URL comes back.
//
// PNG, JPG and GIF only: they are what every mail client shows. WebP and SVG
// are refused because Outlook on Windows displays neither.
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif' }
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  if (!await adminFor(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a picture to upload.' }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Use a PNG, JPG or GIF — other formats do not show in every mail app.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That picture is over 2MB. Aim for 1200 pixels wide and well under 500KB — big images get emails clipped or blocked.' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  // The declared type is the browser's word for it; check the file's own first bytes too.
  const sig = buf.subarray(0, 4).toString('hex')
  const real = sig.startsWith('89504e47') ? 'png' : sig.startsWith('ffd8ff') ? 'jpg' : sig.startsWith('47494638') ? 'gif' : ''
  if (real !== ext) return NextResponse.json({ error: 'That file is not a valid PNG, JPG or GIF.' }, { status: 400 })

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
  const sb = db()
  const { error } = await sb.storage.from('outreach').upload(path, buf, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (error) {
    console.error('[admin/outreach/image]', error.message)
    return NextResponse.json({ error: /bucket/i.test(error.message) ? 'The picture store is not set up yet — run migration 189 in Supabase.' : 'Could not upload that picture.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, url: sb.storage.from('outreach').getPublicUrl(path).data.publicUrl })
}
