import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { email, code } = await req.json()
    if (!email || !code) return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })

    const { data: link } = await supabase
      .from('school_magic_links')
      .select('*, schools(id, name, slug, headteacher, ofsted_rating, pupil_count)')
      .eq('email', email.toLowerCase())
      .eq('token', code.toString())
      .eq('used', false)
      .maybeSingle()

    if (!link) return NextResponse.json({ error: 'Invalid or expired code — please try again' }, { status: 401 })
    if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'This code has expired — please request a new one' }, { status: 401 })

    // Mark used
    await supabase
      .from('school_magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', link.id)

    // Get school user record
    const { data: schoolUser } = await supabase
      .from('school_users')
      .select('name, role')
      .eq('email', email.toLowerCase())
      .eq('school_id', link.school_id)
      .maybeSingle()

    const school = Array.isArray(link.schools) ? link.schools[0] : link.schools as { slug: string; name: string } | null

    // Check if this school has a live workspace (returning paid user)
    let redirect_to: string | undefined
    if (school?.slug) {
      const { data: fullSchool } = await supabase
        .from('schools')
        .select('workspace_type, live_school_id')
        .eq('slug', school.slug)
        .single()
      if (fullSchool?.live_school_id) {
        const { data: live } = await supabase
          .from('schools')
          .select('slug')
          .eq('id', fullSchool.live_school_id)
          .single()
        if (live) redirect_to = `/school/${live.slug}`
      } else if (fullSchool?.workspace_type === 'live') {
        redirect_to = `/school/${school.slug}`
      }
    }

    return NextResponse.json({
      success: true,
      school_slug: school?.slug,
      school_name: school?.name,
      user: { email: email.toLowerCase(), name: schoolUser?.name, role: schoolUser?.role },
      redirect_to,
    })
  } catch (err) {
    console.error('[schools/verify-otp]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
