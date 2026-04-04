import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { welcomePaidEmail } from '@/lib/emails/welcome-paid'
import { logEmail } from '@/lib/emails/log'
import { sendEmail } from '@/lib/emails/send'

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
  if (trial.business_id) return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  // Generate slug for the business (check businesses table for collisions)
  const base = trial.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
  let bizSlug = base
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`
    const { data: clash } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!clash) { bizSlug = candidate; break }
  }

  // Create the business record
  const { data: business, error: createError } = await supabase
    .from('businesses')
    .insert({
      company_name: (trial.company_name || '').trim(),
      slug: bizSlug,
      logo_url: trial.logo_url,
      owner_email: trial.owner_email,
      owner_name: trial.owner_name,
      status: 'active',
      plan: 'paid',
      departments: merge ? trial.departments : [],
      integrations: merge ? trial.integrations : [],
      invite_emails: merge ? trial.invite_emails : [],
      demo_tenant_id: trial.id,
      onboarded: true,
    })
    .select('id, slug')
    .single()

  if (createError || !business) {
    console.error('[workspace/create] Failed to create business:', createError)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }

  // Soft-delete the trial: mark as converted, link to business
  await supabase
    .from('demo_tenants')
    .update({
      status: 'converted',
      expires_at: null,
      converted_at: new Date().toISOString(),
      deleted_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      business_id: business.id,
    })
    .eq('id', trial.id)

  // Create a session for the business workspace
  const sessionToken = crypto.randomUUID()
  await supabase.from('business_sessions').insert({
    token: sessionToken,
    business_id: business.id,
    email: session.email,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Send welcome paid email (fire-and-forget)
  sendWelcomeEmail(business.id, business.slug, trial.owner_name, trial.owner_email).catch(console.error)

  return NextResponse.json({
    success: true,
    slug: business.slug,
    session_token: sessionToken,
  })
}

async function sendWelcomeEmail(id: string, slug: string, ownerName: string, ownerEmail: string) {
  const firstName = ownerName?.split(' ')[0] || 'there'

  const { error } = await sendEmail({
    from: 'Lumio <hello@lumiocms.com>',
    to: [ownerEmail],
    subject: "You're live on Lumio — here's everything you need 🎉",
    html: welcomePaidEmail({ name: firstName, slug }),
  })

  if (error) {
    console.error('[workspace/create] Welcome email failed:', error)
    return
  }

  const supabase = getSupabase()
  await supabase.from('businesses').update({ welcome_email_sent: true }).eq('id', id)
  logEmail(id, 'welcome_paid', ownerEmail).catch(() => {})
}
