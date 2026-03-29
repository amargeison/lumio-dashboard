import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { emailLayout, ctaButton } from '@/lib/emails/layout'

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
        if (tenant.business_id) {
          const { data: biz } = await supabase.from('businesses').select('slug').eq('id', tenant.business_id).single()
          if (biz) redirect_to = `/${biz.slug}`
        }
        return NextResponse.json({ session_token: sessionToken, company: { id: tenant.id, name: tenant.company_name, slug: tenant.slug }, user: { email: email.toLowerCase(), name: tenant.owner_name }, is_new_user: isNewUser, redirect_to })
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

      // Send welcome email (fire-and-forget)
      const firstName = (tenant.owner_name || '').split(' ')[0] || 'there'
      sendEmail({
        from: 'Lumio <hello@lumiocms.com>',
        to: [email],
        subject: 'Welcome to Lumio — your trial workspace is ready 🚀',
        html: emailLayout({
          preheader: 'Your 14-day free trial is ready. Here\'s what to do next.',
          body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome to Lumio, ${firstName}!</h1>
<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Your 14-day free trial is ready. Here&rsquo;s what to do next:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="font-size:20px;margin-right:12px;vertical-align:middle;">🎯</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Explore your dashboard</strong> &mdash; your demo data is already loaded</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="font-size:20px;margin-right:12px;vertical-align:middle;">🎙️</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Try the voice assistant</strong> &mdash; say &ldquo;Hi Lumio&rdquo; to get started</span>
  </td></tr>
  <tr><td style="padding:12px 0;">
    <span style="font-size:20px;margin-right:12px;vertical-align:middle;">👥</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Invite your team</strong> &mdash; the more the merrier</span>
  </td></tr>
</table>
${ctaButton('Go to my workspace &rarr;', `https://lumiocms.com/demo/${tenant.slug}`)}
<p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">Your trial expires in 14 days. No credit card needed.</p>
<p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">Questions? Reply to this email or visit lumiocms.com</p>`,
        }),
      }).catch(err => console.error('[demo/verify-otp] Welcome email failed:', err))
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
      if (biz) redirect_to = `/${biz.slug}`
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
