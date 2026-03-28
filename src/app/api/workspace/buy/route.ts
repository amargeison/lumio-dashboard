import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { welcomePaidEmail } from '@/lib/emails/welcome-paid'
import { logEmail } from '@/lib/emails/log'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/workspace/buy
 * Creates a new business workspace from the direct purchase flow.
 * Returns a session token so the user can access their workspace immediately.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json().catch(() => null)
  if (!body?.companyName || !body?.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { companyName, email, firstName, lastName, plan, industry, size } = body

  // Generate slug (check for collisions)
  const base = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+$/, '') || 'my-company'
  let slug = base
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data: clash } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!clash) { slug = candidate; break }
  }

  // Create the business record
  const { data: business, error: createError } = await supabase
    .from('businesses')
    .insert({
      company_name: companyName.trim(),
      slug,
      owner_email: email,
      owner_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
      status: 'active',
      plan: plan || 'growth',
      onboarding_complete: false,
    })
    .select('id, slug')
    .single()

  if (createError || !business) {
    console.error('[workspace/buy] Failed to create business:', createError)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }

  // Create session token
  const sessionToken = crypto.randomUUID()
  const { error: sessionError } = await supabase.from('business_sessions').insert({
    token: sessionToken,
    business_id: business.id,
    email,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  if (sessionError) {
    console.error('[workspace/buy] Failed to create session:', sessionError)
    // Still return the slug so the user can at least reach the page
    return NextResponse.json({ success: true, slug: business.slug, session_token: null })
  }

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail(business.id, business.slug, `${firstName || ''} ${lastName || ''}`.trim(), email).catch(console.error)

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
    console.error('[workspace/buy] Welcome email failed:', error)
    return
  }
  const supabase = getSupabase()
  await supabase.from('businesses').update({ welcome_email_sent: true }).eq('id', id)
  logEmail(id, 'welcome_paid', ownerEmail).catch(() => {})
}
