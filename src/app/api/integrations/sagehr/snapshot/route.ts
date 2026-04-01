import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase.from('business_sessions').select('business_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'sagehr').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Sage HR not connected', connected: false }, { status: 404 })

  const apiKey = creds.access_token
  const baseUrl = 'https://api.sage.hr/api/v1'
  const headers = { Accept: 'application/json', Authorization: `Bearer ${apiKey}` }

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [employeesRes, leaveRes, newStartersRes] = await Promise.all([
      fetch(`${baseUrl}/employees?status=active`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${baseUrl}/leave-requests?status=pending`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${baseUrl}/employees?hired_from=${monthStart}`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
    ])

    const employees = employeesRes.data || []
    const pendingLeave = leaveRes.data || []
    const newStarters = newStartersRes.data || []
    const onLeaveToday = employees.filter((e: any) => e.status === 'on_leave')

    return NextResponse.json({
      connected: true, provider: 'sagehr',
      headcount: employees.length,
      pendingLeave: pendingLeave.length,
      newStarters: newStarters.length,
      leavers: 0,
      offSick: onLeaveToday.length,
    })
  } catch (err) {
    console.error('[sagehr/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Sage HR data', connected: true }, { status: 502 })
  }
}
