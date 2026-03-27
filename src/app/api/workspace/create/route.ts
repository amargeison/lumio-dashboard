import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { welcomePaidEmail } from '@/lib/emails/welcome-paid'
import { logEmail } from '@/lib/emails/log'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-demo-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { merge } = await req.json().catch(() => ({ merge: false }))

  // Validate session and get trial tenant
  const { data: session } = await supabase
    .from('demo_sessions')
    .select('tenant_id, email')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: trial } = await supabase
    .from('demo_tenants')
    .select('*')
    .eq('id', session.tenant_id)
    .single()

  if (!trial) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  if (trial.workspace_type === 'live') return NextResponse.json({ error: 'Already a live workspace' }, { status: 400 })

  // Generate slug for the live workspace (same as trial, or with suffix on collision)
  let liveSlug = trial.slug
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? trial.slug : `${trial.slug}${attempt + 1}`
    const { data: clash } = await supabase
      .from('demo_tenants')
      .select('id')
      .eq('slug', candidate)
      .neq('id', trial.id)
      .maybeSingle()
    if (!clash) { liveSlug = candidate; break }
  }

  // Create the live workspace record
  const { data: liveWorkspace, error: createError } = await supabase
    .from('demo_tenants')
    .insert({
      slug: liveSlug,
      company_name: trial.company_name,
      owner_email: trial.owner_email,
      owner_name: trial.owner_name,
      logo_url: trial.logo_url,
      departments: merge ? trial.departments : [],
      integrations: merge ? trial.integrations : [],
      invite_emails: merge ? trial.invite_emails : [],
      status: 'active',
      workspace_type: 'live',
      gdpr_consent: trial.gdpr_consent,
      marketing_consent: trial.marketing_consent,
      gdpr_consent_at: trial.gdpr_consent_at,
      activated_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
      welcome_email_sent: false,
    })
    .select('id, slug')
    .single()

  if (createError || !liveWorkspace) {
    console.error('[workspace/create] Failed to create live workspace:', createError)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }

  // Update trial tenant: mark as converted, link to live workspace
  await supabase
    .from('demo_tenants')
    .update({
      status: 'converted',
      expires_at: null,
      converted_at: new Date().toISOString(),
      live_workspace_id: liveWorkspace.id,
    })
    .eq('id', trial.id)

  // Create a session for the live workspace
  const sessionToken = crypto.randomUUID()
  await supabase.from('demo_sessions').insert({
    token: sessionToken,
    tenant_id: liveWorkspace.id,
    email: session.email,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Send welcome paid email (fire-and-forget)
  sendWelcomeEmail(liveWorkspace.id, liveWorkspace.slug, trial.owner_name, trial.owner_email).catch(console.error)

  return NextResponse.json({
    success: true,
    slug: liveWorkspace.slug,
    session_token: sessionToken,
  })
}

async function sendWelcomeEmail(id: string, slug: string, ownerName: string, ownerEmail: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const firstName = ownerName?.split(' ')[0] || 'there'

  const { error } = await resend.emails.send({
    from: 'Lumio <hello@lumiocms.com>',
    to: [ownerEmail],
    subject: "You're live on Lumio — here's everything you need 🎉",
    html: welcomePaidEmail({ name: firstName, slug }),
  })

  if (error) {
    console.error('[workspace/create] Welcome email failed:', error)
    return
  }

  await supabase_markWelcomeSent(id)
  logEmail(id, 'welcome_paid', ownerEmail).catch(() => {})
}

async function supabase_markWelcomeSent(tenantId: string) {
  const supabase = getSupabase()
  await supabase.from('demo_tenants').update({ welcome_email_sent: true }).eq('id', tenantId)
}
