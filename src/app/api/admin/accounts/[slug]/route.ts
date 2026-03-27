import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const { data } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return data
}

// GET — fetch single account
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { slug } = await params
  const type = req.nextUrl.searchParams.get('type') || 'business'

  if (type === 'schools') {
    const { data } = await supabase.from('schools').select('*').eq('slug', slug).maybeSingle()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: logs } = await supabase.from('activity_log').select('*').eq('account_slug', slug).order('created_at', { ascending: false }).limit(50)
    return NextResponse.json({ account: data, activity: logs || [], type: 'schools' })
  }

  const { data } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: logs } = await supabase.from('activity_log').select('*').eq('account_slug', slug).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ account: data, activity: logs || [], type: 'business' })
}

// PATCH — update account fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { slug } = await params
  const body = await req.json()
  const type = body.type || 'business'
  delete body.type

  const table = type === 'schools' ? 'schools' : 'businesses'
  const { error } = await supabase.from(table).update(body).eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — hard delete account + auth user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { slug } = await params
  const type = req.nextUrl.searchParams.get('type') || 'business'

  let ownerEmail: string | null = null

  if (type === 'schools') {
    const { data: school } = await supabase.from('schools').select('id, owner_email').eq('slug', slug).maybeSingle()
    if (school) {
      ownerEmail = school.owner_email || null
      await supabase.from('school_users').delete().eq('school_id', school.id)
      await supabase.from('school_magic_links').delete().eq('school_id', school.id)
      await supabase.from('schools').delete().eq('id', school.id)
    }
  } else {
    const { data: biz } = await supabase.from('businesses').select('id, owner_email').eq('slug', slug).maybeSingle()
    if (biz) {
      ownerEmail = biz.owner_email || null
      await supabase.from('business_sessions').delete().eq('business_id', biz.id)
      await supabase.from('businesses').delete().eq('id', biz.id)
    }
  }

  // Clean up the Supabase Auth user so the email can be reused
  if (ownerEmail) {
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const authUser = users.find(u => u.email === ownerEmail)
      if (authUser) await supabase.auth.admin.deleteUser(authUser.id)
    } catch { /* auth cleanup is best-effort */ }
  }

  await supabase.from('activity_log').delete().eq('account_slug', slug)
  return NextResponse.json({ success: true })
}
