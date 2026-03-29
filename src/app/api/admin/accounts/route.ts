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

export async function GET(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()

  const type = req.nextUrl.searchParams.get('type') || 'business'
  const search = req.nextUrl.searchParams.get('search') || ''

  if (type === 'schools') {
    let query = supabase.from('schools').select('id, name, slug, plan, workspace_type, active, trial_ends_at, created_at, admin_notes, onboarded, billing_type')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
    if (error) console.error('[admin/accounts] schools query error:', error.message)
    console.log('[admin/accounts] schools query returned', data?.length ?? 0, 'rows')
    return NextResponse.json({ accounts: data || [], type: 'schools' })
  }

  let query = supabase.from('businesses').select('id, company_name, slug, plan, status, onboarding_complete, demo_data_active, created_at, admin_notes, owner_email, billing_type')
  if (search) query = query.ilike('company_name', `%${search}%`)
  const { data } = await query.order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ accounts: data || [], type: 'business' })
}

// POST — create a new school from admin panel
export async function POST(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()

  try {
    const { name, slug: customSlug, type: schoolType, plan, adminName, adminEmail, adminRole } = await req.json()

    if (!name || !adminEmail) {
      return NextResponse.json({ error: 'School name and admin email are required' }, { status: 400 })
    }

    // Generate unique slug (use custom if provided)
    let baseSlug = (customSlug || name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    let slug = baseSlug
    let counter = 2
    while (true) {
      const { data: existing } = await supabase.from('schools').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Extract email domain
    const emailDomain = adminEmail.split('@')[1]?.toLowerCase() || null

    // Create school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: name.trim(),
        slug,
        type: schoolType || 'primary',
        plan: plan || 'starter',
        email_domain: emailDomain,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        onboarded: false,
      })
      .select()
      .single()

    if (schoolError || !school) {
      console.error('[admin/create-school]', schoolError)
      return NextResponse.json({ error: schoolError?.message || 'Failed to create school' }, { status: 500 })
    }

    // Create school_user for the admin
    if (adminName || adminEmail) {
      const { error: userError } = await supabase.from('school_users').insert({
        school_id: school.id,
        name: adminName || adminEmail.split('@')[0],
        email: adminEmail.toLowerCase(),
        role: adminRole || 'headteacher',
      })
      if (userError) console.error('[admin/create-school] school_user insert error', userError)
    }

    return NextResponse.json({ success: true, school_slug: slug, school_id: school.id })
  } catch (err) {
    console.error('[admin/create-school]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
