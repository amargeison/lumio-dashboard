import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const supabase = getSupabase()
  const { slug } = await params

  const { data: school, error } = await supabase
    .from('schools')
    .select('id, name, slug, town, headteacher, ofsted_rating, pupil_count, staff_count, plan, trial_ends_at, workspace_type, active, live_school_id, onboarding_completed, demo_data_active')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[schools/slug] fetch error', error)
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 })
  }
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  return NextResponse.json(school)
}
