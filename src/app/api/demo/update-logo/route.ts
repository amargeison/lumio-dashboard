import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const { slug, logo_url } = await req.json()
    if (!slug || !logo_url) {
      return NextResponse.json({ error: 'slug and logo_url required' }, { status: 400 })
    }
    const supabase = getSupabase()
    const { error } = await supabase
      .from('demo_tenants')
      .update({ logo_url })
      .eq('slug', slug)
    if (error) {
      console.error('[demo/update-logo] update error', error)
      return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[demo/update-logo] exception', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
