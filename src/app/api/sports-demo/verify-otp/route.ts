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
  try {
    const { email, code, sport } = await req.json()

    // Dev bypass
    if (code === '000000' && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true })
    }

    const { data, error } = await supabase
      .from('demo_magic_links')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('slug', `sports-demo-${sport}`)
      .eq('token', code.toString())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' })
    }

    await supabase
      .from('demo_magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('slug', `sports-demo-${sport}`)
      .eq('token', code.toString())

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[sports-demo/verify-otp] Error:', err)
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
