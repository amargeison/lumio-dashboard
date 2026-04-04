import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/** Check if a user has a PIN set — used by login page to decide PIN vs OTP flow */
export async function POST(req: NextRequest) {
  const { email, type } = await req.json().catch(() => ({ email: '', type: 'business' }))
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = getSupabase()

  if (type === 'school') {
    const { data } = await supabase.from('school_users')
      .select('login_method')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    return NextResponse.json({ has_pin: data?.login_method === 'pin' })
  }

  const { data } = await supabase.from('demo_tenants')
    .select('login_method')
    .eq('owner_email', email.toLowerCase())
    .maybeSingle()
  return NextResponse.json({ has_pin: data?.login_method === 'pin' })
}
