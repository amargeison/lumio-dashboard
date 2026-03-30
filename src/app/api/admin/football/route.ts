import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const { data } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { data, error } = await supabase.from('football_clubs').select('*').order('created_at', { ascending: false })
  if (error) console.error('[admin/football] query error:', error.message)
  return NextResponse.json({ clubs: data || [] })
}
