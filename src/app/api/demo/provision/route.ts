import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { session_token, company_name, logo_url, departments, integrations, invites } = await req.json()

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
      .select('slug, company_name')
      .single()

    if (error) {
      console.error('Provision error:', error)
      return NextResponse.json({ error: 'Failed to provision workspace' }, { status: 500 })
    }

    // Send invite emails if any
    if (invites?.length) {
      const validInvites = invites.filter((e: string) => e && e.includes('@'))
      // Fire-and-forget invite emails (don't block response)
      sendInviteEmails(validInvites, tenant.company_name, tenant.slug).catch(console.error)
    }

    return NextResponse.json({ success: true, slug: tenant.slug })
  } catch (err) {
    console.error('Provision error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function sendInviteEmails(emails: string[], companyName: string, slug: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'

  await Promise.allSettled(
    emails.map(email =>
      resend.emails.send({
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
