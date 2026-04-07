import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { welcomeTrialEmail } from '@/lib/emails/welcome-trial'
import { logEmail } from '@/lib/emails/log'

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

    // Dev bypass: code 000000 auto-approves on non-production environments
    const isDev = process.env.NEXT_PUBLIC_ENV === 'dev' || (process.env.NODE_ENV !== 'production')
    if (isDev && code.toString() === '000000') {
      // Find the most recent magic link for this email (any status) to get the slug
      const { data: devLink } = await supabase
        .from('demo_magic_links')
        .select('*')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (devLink) {
        // Continue with this link as if it were valid — fall through to the rest of the handler
        const link = devLink
        // Skip to tenant lookup below
        const { data: tenant, error: tenantError } = await supabase.from('demo_tenants').select('*').eq('slug', link.slug).maybeSingle()
        if (!tenant) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
        const isNewUser = tenant.status === 'pending_onboarding'
        if (isNewUser) {
          await supabase.from('demo_tenants').update({ status: 'active', activated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', tenant.id)
        }
        const sessionToken = crypto.randomUUID()
        await supabase.from('demo_sessions').insert({ token: sessionToken, tenant_id: tenant.id, email: email.toLowerCase(), expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
        let redirect_to: string | undefined
        if (tenant.tenant_type === 'schools') {
          redirect_to = `/demo/schools/${tenant.slug}`
        } else if (tenant.business_id) {
          const { data: biz } = await supabase.from('businesses').select('slug').eq('id', tenant.business_id).single()
          // Always send to demo workspace — live workspace requires workspace_session_token which isn't set here
          if (biz) redirect_to = `/demo/${biz.slug}`
        }
        return NextResponse.json({ session_token: sessionToken, company: { id: tenant.id, name: tenant.company_name, slug: tenant.slug }, user: { email: email.toLowerCase(), name: tenant.owner_name }, is_new_user: isNewUser, is_school_demo: tenant.tenant_type === 'schools', logo_url: tenant.logo_url || null, redirect_to })
      }
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

      // Send welcome email and mark as sent
      const firstName = (tenant.owner_name || '').split(' ')[0] || 'there'
      const expiresDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      try {
        const { error: emailErr } = await sendEmail({
          from: 'Lumio <hello@lumiocms.com>',
          to: [email],
          subject: 'Welcome to Lumio — your 14-day trial starts now 🚀',
          html: welcomeTrialEmail({ name: firstName, slug: tenant.slug, expiresDate }),
        })
        if (emailErr) {
          console.error('[demo/verify-otp] Welcome email failed:', emailErr)
        } else {
          await supabase.from('demo_tenants').update({ welcome_email_sent: true }).eq('id', tenant.id)
          logEmail(tenant.id, 'welcome_trial', email).catch(() => {})
        }
      } catch (err) {
        console.error('[demo/verify-otp] Welcome email error:', err)
      }
    }

    // Provision a businesses row for new signups (or any tenant missing business_id)
    // This enables the workspace logo upload (which needs business_id) to work for demo users.
    // Skip for schools tenants — they don't belong in the businesses table.
    if (tenant.tenant_type !== 'schools' && !tenant.business_id) {
      try {
        const { data: newBusiness, error: bizErr } = await supabase
          .from('businesses')
          .insert({
            slug: tenant.slug,
            company_name: tenant.company_name,
            owner_email: email.toLowerCase(),
            owner_name: tenant.owner_name || '',
            plan: 'trial',
            status: 'active',
            billing_type: 'monthly',
            onboarded: false,
            demo_data_active: true,
            created_at: new Date().toISOString(),
          })
          .select('id, slug')
          .single()

        if (bizErr) {
          console.error('[demo/verify-otp] Business provision failed:', bizErr.message)
        } else if (newBusiness) {
          await supabase
            .from('demo_tenants')
            .update({ business_id: newBusiness.id })
            .eq('id', tenant.id)
          tenant.business_id = newBusiness.id
        }
      } catch (e) {
        console.error('[demo/verify-otp] Business provision exception:', e)
      }
    }

    // Create session token (30-day expiry)
    const sessionToken = crypto.randomUUID()
    await supabase.from('demo_sessions').insert({
      token: sessionToken,
      tenant_id: tenant.id,
      email: email.toLowerCase(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Build redirect — schools go to /demo/schools/[slug], business tenants to /demo/[slug]
    let redirect_to: string | undefined
    if (tenant.tenant_type === 'schools') {
      redirect_to = `/demo/schools/${tenant.slug}`
    } else if (tenant.business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('slug')
        .eq('id', tenant.business_id)
        .single()
      // Always send to demo workspace — live workspace requires workspace_session_token which isn't set here
      if (biz) redirect_to = `/demo/${biz.slug}`
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
      is_school_demo: tenant.tenant_type === 'schools',
      logo_url: tenant.logo_url || null,
      redirect_to,
    })
  } catch (err) {
    console.error('Demo OTP verify error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
