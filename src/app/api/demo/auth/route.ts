import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    // Look up magic link token
    const { data: link, error: linkError } = await supabase
      .from('demo_magic_links')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (linkError || !link) {
      return NextResponse.json({ error: 'This link has expired or has already been used.' }, { status: 401 })
    }

    if (link.used) {
      return NextResponse.json({ error: 'This link has already been used. Please request a new one.' }, { status: 401 })
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired. Please request a new magic link.' }, { status: 401 })
    }

    // Mark token as used
    await supabase
      .from('demo_magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token)

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

    // Determine if new user (pending onboarding)
    const isNewUser = tenant.status === 'pending_onboarding'

    // If first login, mark as active and record activation time
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

    // Fire new-signup notification to Arron — never block signup on failure.
    if (isNewUser) {
      try {
        await resend.emails.send({
          from: 'Lumio <notifications@lumiocms.com>',
          to: 'hello@lumiocms.com',
          subject: '🚀 New Demo Signup',
          html: `
            <h2>New demo account created</h2>
            <p><strong>Name:</strong> ${tenant.owner_name || 'Unknown'}</p>
            <p><strong>Email:</strong> ${link.email || 'Unknown'}</p>
            <p><strong>Company:</strong> ${tenant.company_name || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><a href="https://lumiocms.com/admin">View in Admin Centre</a></p>
          `,
        })
      } catch (notifyErr) {
        console.error('New signup notification failed:', notifyErr)
      }
    }

    // Create session token
    const sessionToken = crypto.randomUUID()
    await supabase.from('demo_sessions').insert({
      token: sessionToken,
      tenant_id: tenant.id,
      email: link.email,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })

    return NextResponse.json({
      session_token: sessionToken,
      company: {
        id: tenant.id,
        name: tenant.company_name,
        slug: tenant.slug,
      },
      user: {
        email: link.email,
        name: tenant.owner_name,
      },
      is_new_user: isNewUser,
    })
  } catch (err) {
    console.error('Demo auth error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
