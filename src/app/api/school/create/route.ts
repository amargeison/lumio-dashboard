import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { school_slug, merge } = await req.json()
    if (!school_slug) return NextResponse.json({ error: 'Missing school_slug' }, { status: 400 })

    // Get trial school record
    const { data: trial } = await supabase
      .from('schools')
      .select('*')
      .eq('slug', school_slug)
      .single()

    if (!trial) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    if (trial.workspace_type === 'live') return NextResponse.json({ error: 'Already a live workspace' }, { status: 400 })

    // Generate slug for live workspace
    const base = trial.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    let liveSlug = base
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = attempt === 0 ? base : `${base}${attempt + 1}`
      const { data: clash } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', candidate)
        .neq('id', trial.id)
        .maybeSingle()
      if (!clash) { liveSlug = candidate; break }
    }

    // Create live school record
    const { data: liveSchool, error: createError } = await supabase
      .from('schools')
      .insert({
        name: trial.name,
        slug: liveSlug,
        type: trial.type,
        phase: trial.phase,
        ofsted_rating: trial.ofsted_rating,
        pupil_count: trial.pupil_count,
        staff_count: trial.staff_count,
        address: trial.address,
        town: trial.town,
        postcode: trial.postcode,
        headteacher: trial.headteacher,
        business_manager: trial.business_manager,
        phone: trial.phone,
        email: trial.email,
        website: trial.website,
        plan: trial.plan || 'school',
        workspace_type: 'live',
        active: true,
        onboarded: true,
      })
      .select('id, slug')
      .single()

    if (createError || !liveSchool) {
      console.error('[school/create] Failed to create live school:', createError)
      return NextResponse.json({ error: 'Failed to create school workspace' }, { status: 500 })
    }

    // Copy school users if merging
    if (merge) {
      const { data: users } = await supabase
        .from('school_users')
        .select('school_id, name, email, role')
        .eq('school_id', trial.id)

      if (users?.length) {
        await supabase.from('school_users').insert(
          users.map(u => ({ ...u, school_id: liveSchool.id }))
        )
      }
    }

    // Update trial: mark as converted, link to live school
    await supabase
      .from('schools')
      .update({
        workspace_type: 'converted' as any,
        live_school_id: liveSchool.id,
        converted_at: new Date().toISOString(),
        active: false,
      })
      .eq('id', trial.id)

    return NextResponse.json({
      success: true,
      slug: liveSchool.slug,
    })
  } catch (err) {
    console.error('[school/create] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
