import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectRole } from '@/lib/detect-role'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase.from('business_sessions').select('business_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { email, role: inviteRole, name, jobTitle } = await req.json()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  // Check if already exists
  const { data: existing } = await supabase.from('workspace_staff').select('id').eq('business_id', session.business_id).eq('email', email.toLowerCase()).maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, message: 'Staff member already exists' })
  }

  // Auto-detect role from job title or use invite role
  const detected = jobTitle ? detectRole(jobTitle) : { role: inviteRole || 'user', role_level: inviteRole === 'admin' ? 2 : inviteRole === 'manager' ? 3 : 4 }

  // Add to workspace_staff
  const { error: insertError } = await supabase.from('workspace_staff').insert({
    business_id: session.business_id,
    email: email.toLowerCase(),
    first_name: name?.split(' ')[0] || email.split('@')[0] || null,
    last_name: name?.split(' ').slice(1).join(' ') || null,
    job_title: jobTitle || null,
    role: detected.role,
    role_level: detected.role_level,
  })

  if (insertError) {
    console.error('[workspace/invite] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Team member invited' })
}
