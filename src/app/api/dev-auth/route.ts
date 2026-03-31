import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: '' }))
  const devPin = process.env.DEV_ACCESS_PIN

  if (!devPin || pin !== devPin) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  const supabase = getSupabase()

  // Find first active business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, company_name, owner_email, owner_name')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let sessionToken = ''
  let slug = ''

  if (business) {
    slug = business.slug
    // Create a workspace session
    sessionToken = crypto.randomUUID()
    await supabase.from('business_sessions').insert({
      token: sessionToken,
      business_id: business.id,
      email: business.owner_email || 'dev@lumiocms.com',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  const response = NextResponse.json({
    success: true,
    session_token: sessionToken,
    slug,
    company_name: business?.company_name || '',
    owner_name: business?.owner_name || '',
  })

  response.cookies.set('lumio_dev_access', devPin, {
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: false,
    sameSite: 'lax',
  })

  if (slug) {
    response.cookies.set('lumio_tenant_slug', slug, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  return response
}
