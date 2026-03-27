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

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    // Find the most recent unused code for this email
    const { data: link, error: linkError } = await supabase
      .from('demo_magic_links')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('token', code.toString())
      .eq('used', false)
      .maybeSingle()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid or expired code — please try again' }, { status: 401 })
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This code has expired — please request a new one' }, { status: 401 })
    }

    // Mark code as used
    await supabase
      .from('demo_magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', code.toString())
      .eq('email', email.toLowerCase())

    // Get tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('demo_tenants')
      .select('*')
      .eq('slug', link.slug)
      .maybeSingle()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
    }

    if (tenant.status === 'deleted') {
      return NextResponse.json({ error: 'This demo workspace has been deleted.' }, { status: 410 })
    }

    const isNewUser = tenant.status === 'pending_onboarding'

    if (isNewUser) {
      await supabase
        .from('demo_tenants')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', tenant.id)
    }

    // Create session token (30-day expiry)
    const sessionToken = crypto.randomUUID()
    await supabase.from('demo_sessions').insert({
      token: sessionToken,
      tenant_id: tenant.id,
      email: email.toLowerCase(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Check if this user has a paid business workspace (returning paid user)
    let redirect_to: string | undefined
    if (tenant.business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('slug')
        .eq('id', tenant.business_id)
        .single()
      if (biz) redirect_to = `/workspace/${biz.slug}`
    }

    return NextResponse.json({
      session_token: sessionToken,
      company: {
        id: tenant.id,
        name: tenant.company_name,
        slug: tenant.slug,
      },
      user: {
        email: email.toLowerCase(),
        name: tenant.owner_name,
      },
      is_new_user: isNewUser,
      redirect_to,
    })
  } catch (err) {
    console.error('Demo OTP verify error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
