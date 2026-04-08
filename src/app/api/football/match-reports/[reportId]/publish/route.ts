import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    const publishTo: string[] = Array.isArray(body?.publishTo) ? body.publishTo : []

    const { error } = await supabase
      .from('football_match_reports')
      .update({
        published_at: new Date().toISOString(),
        published_to: publishTo,
      })
      .eq('id', reportId)

    if (error) {
      console.error('[match-report publish]', error)
      return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[match-report publish]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
