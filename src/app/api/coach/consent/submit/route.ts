import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public parent consent form submission. No auth — a parent fills the form at
// /tennis/coach/{slug}/consent. We resolve the coach by portal_slug and store a
// PENDING submission (service role) which the coach reviews and applies to a
// player. Submissions are quarantined until the coach applies them.

// GET — minimal academy info for the public form header.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ academy: null })
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await admin.from('sports_profiles').select('brand_name, display_name').eq('portal_slug', slug).eq('sport', 'coach').maybeSingle()
  if (!data) return NextResponse.json({ academy: null }, { status: 404 })
  return NextResponse.json({ academy: (data as any).brand_name || (data as any).display_name || null })
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const { slug, child_name, child_age, parent_name, parent_email, consent_data, consent_photo, consent_medical, medical_notes } = body
  if (!slug || !String(child_name || '').trim() || !String(parent_name || '').trim()) {
    return NextResponse.json({ error: 'Child name and parent name are required' }, { status: 400 })
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data: coach } = await admin.from('sports_profiles').select('id').eq('portal_slug', slug).eq('sport', 'coach').maybeSingle()
  if (!coach) return NextResponse.json({ error: 'Academy not found' }, { status: 404 })

  const { error } = await admin.from('coach_consent_submissions').insert({
    coach_id: (coach as any).id,
    child_name: String(child_name).trim(),
    child_age: child_age ? Number(child_age) : null,
    parent_name: String(parent_name).trim(),
    parent_email: parent_email || null,
    consent_data: !!consent_data,
    consent_photo: !!consent_photo,
    consent_medical: !!consent_medical,
    medical_notes: medical_notes || null,
    status: 'pending',
  })
  if (error) { console.error('[coach/consent/submit]', error.message); return NextResponse.json({ error: 'Could not submit' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
