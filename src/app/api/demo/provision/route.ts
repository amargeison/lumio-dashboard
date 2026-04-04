import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { welcomeTrialEmail } from '@/lib/emails/welcome-trial'
import { followupTrialEmail } from '@/lib/emails/followup-trial'
import { followup14dEmail } from '@/lib/emails/followup-14d'
import { logEmail } from '@/lib/emails/log'
import { sendEmail } from '@/lib/emails/send'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await req.json()
    const session_token = req.headers.get('x-demo-token') || body.session_token
    const { company_name, logo_url, departments, integrations, invites } = body

    if (!session_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session
    const { data: session } = await supabase
      .from('demo_sessions')
      .select('tenant_id, email')
      .eq('token', session_token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
    }

    // Update tenant with onboarding data
    const { data: tenant, error } = await supabase
      .from('demo_tenants')
      .update({
        company_name: company_name || undefined,
        logo_url: logo_url || undefined,
        departments: departments || [],
        integrations: integrations || [],
        invite_emails: invites?.filter(Boolean) || [],
        status: 'active',
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', session.tenant_id)
      .select('id, slug, company_name, owner_name, owner_email, expires_at, welcome_email_sent')
      .single()

    if (error) {
      console.error('Provision error:', error)
      return NextResponse.json({ error: 'Failed to provision workspace' }, { status: 500 })
    }

    // Send invite emails if any
    if (invites?.length) {
      const validInvites = invites.filter((e: string) => e && e.includes('@'))
      sendInviteEmails(validInvites, tenant.company_name, tenant.slug).catch(console.error)
    }

    // Send trial welcome email (once only)
    if (!tenant.welcome_email_sent) {
      sendWelcomeEmail(tenant).catch(console.error)
    }

    return NextResponse.json({ success: true, slug: tenant.slug })
  } catch (err) {
    console.error('Provision error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function sendWelcomeEmail(tenant: { id: string; slug: string; company_name: string; owner_name: string; owner_email: string; expires_at: string }) {
  const supabase = getSupabase()

  const expiresDate = new Date(tenant.expires_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const firstName = tenant.owner_name?.split(' ')[0] || 'there'

  const { error } = await sendEmail({
    from: 'Lumio <hello@lumiocms.com>',
    to: [tenant.owner_email],
    subject: 'Welcome to Lumio — your 14-day trial starts now 🚀',
    html: welcomeTrialEmail({ name: firstName, slug: tenant.slug, expiresDate }),
  })

  if (error) {
    console.error('[provision] Welcome email failed:', error)
    return
  }

  await supabase.from('demo_tenants').update({ welcome_email_sent: true }).eq('id', tenant.id)
  logEmail(tenant.id, 'welcome_trial', tenant.owner_email).catch(() => {})

  // Schedule 48-hour follow-up email
  try {
    const { data: followupData } = await sendEmail({
      from: 'Arron at Lumio <arron@lumiocms.com>',
      to: [tenant.owner_email],
      subject: `Did you get a chance to explore, ${firstName}?`,
      html: followupTrialEmail({ name: firstName, slug: tenant.slug, portalType: 'business' }),
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    if (followupData?.id) {
      await supabase.from('demo_tenants').update({ followup_email_id: followupData.id }).eq('id', tenant.id)
    }
    logEmail(tenant.id, 'followup_48h_scheduled', tenant.owner_email).catch(() => {})
  } catch (e) {
    console.error('[provision] Follow-up email scheduling failed:', e)
  }

  // Schedule 14-day win-back email
  try {
    const { data: winbackData } = await sendEmail({
      from: 'Arron at Lumio <arron@lumiocms.com>',
      to: [tenant.owner_email],
      subject: `Your Lumio workspace is paused, ${firstName}`,
      html: followup14dEmail({ name: firstName, slug: tenant.slug, companyName: tenant.company_name, portalType: 'business' }),
      scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (winbackData?.id) {
      await supabase.from('demo_tenants').update({ followup_14d_email_id: winbackData.id }).eq('id', tenant.id)
    }
    logEmail(tenant.id, 'followup_14d_scheduled', tenant.owner_email).catch(() => {})
  } catch (e) {
    console.error('[provision] 14-day win-back email scheduling failed:', e)
  }
}

async function sendInviteEmails(emails: string[], companyName: string, slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'

  await Promise.allSettled(
    emails.map(email =>
      sendEmail({
        from: 'Lumio <hello@lumiocms.com>',
        to: [email],
        subject: `${companyName} has invited you to their Lumio workspace`,
        html: `
          <p>You've been invited to join the <strong>${companyName}</strong> demo workspace on Lumio.</p>
          <p><a href="${appUrl}/demo/${slug}">Click here to view the workspace →</a></p>
          <p style="color:#999;font-size:12px;">This is a 14-day trial workspace. Lumio Ltd · lumiocms.com</p>
        `,
      })
    )
  )
}
