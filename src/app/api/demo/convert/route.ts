import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { welcomePaidEmail } from '@/lib/emails/welcome-paid'
import { logEmail } from '@/lib/emails/log'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-demo-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('demo_sessions')
    .select('tenant_id')
    .eq('token', token)
    .single()

  if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data: tenant, error } = await supabase
    .from('demo_tenants')
    .update({
      status: 'converted',
      expires_at: null,
      activated_at: new Date().toISOString(),
    })
    .eq('id', session.tenant_id)
    .select('id, slug, owner_name, owner_email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send paid welcome email (fire-and-forget)
  sendPaidWelcomeEmail(tenant).catch(console.error)

  return NextResponse.json({ success: true })
}

async function sendPaidWelcomeEmail(tenant: { id: string; slug: string; owner_name: string; owner_email: string }) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const firstName = tenant.owner_name?.split(' ')[0] || 'there'

  const { error } = await resend.emails.send({
    from: 'Lumio <hello@lumiocms.com>',
    to: [tenant.owner_email],
    subject: "You're live on Lumio — here's everything you need 🎉",
    html: welcomePaidEmail({ name: firstName, slug: tenant.slug }),
  })

  if (error) {
    console.error('[convert] Paid welcome email failed:', error)
    return
  }

  logEmail(tenant.id, 'welcome_paid', tenant.owner_email).catch(() => {})
}
