import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const portalType = req.nextUrl.searchParams.get('portal') || 'business'
  const token = req.headers.get('x-workspace-token')

  if (!token) return NextResponse.json({ notifications: [] })

  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('portal_type', portalType)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ notifications: data || [] })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    if (body.action === 'markRead' && body.id) {
      await supabase.from('notifications').update({ read: true }).eq('id', body.id)
    }
    if (body.action === 'markAllRead' && body.portal) {
      await supabase.from('notifications').update({ read: true }).eq('portal_type', body.portal)
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
