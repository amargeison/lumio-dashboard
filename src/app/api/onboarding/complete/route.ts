import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  await supabase
    .from('businesses')
    .update({ onboarding_complete: true })
    .eq('id', session.business_id)

  const { data: business } = await supabase
    .from('businesses')
    .select('id, owner_email, owner_name')
    .eq('id', session.business_id)
    .maybeSingle()

  if (business?.owner_email) {
    const ownerEmail = business.owner_email
    const ownerName = (business.owner_name || '').trim()
    const firstName = ownerName.split(' ')[0] || 'Owner'
    const lastName = ownerName.split(' ').slice(1).join(' ') || ''

    const { data: existingStaff } = await supabase
      .from('workspace_staff')
      .select('id')
      .eq('business_id', business.id)
      .eq('email', ownerEmail)
      .maybeSingle()

    if (!existingStaff) {
      await supabase.from('workspace_staff').insert({
        business_id: business.id,
        email: ownerEmail,
        first_name: firstName,
        last_name: lastName,
        job_title: 'Founder',
        department: 'Leadership',
        role: 'Admin',
        role_level: 5,
        created_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ success: true })
}
