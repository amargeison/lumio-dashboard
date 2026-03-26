import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-demo-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('demo_sessions')
    .select('tenant_id')
    .eq('token', token)
    .single()

  if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  // Mark as wiped — localStorage cleared client-side in ConvertModal
  // Status stays active until convert is called immediately after
  return NextResponse.json({ success: true })
}
