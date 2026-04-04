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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token, profile_name').eq('business_id', session.business_id).eq('provider', 'bamboohr').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'BambooHR not connected', connected: false }, { status: 404 })

  // access_token stores the API key, profile_name stores the subdomain
  const apiKey = creds.access_token
  const subdomain = creds.profile_name || 'company'
  const baseUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1`
  const headers = { Accept: 'application/json', Authorization: `Basic ${Buffer.from(apiKey + ':x').toString('base64')}` }

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [directoryRes, leaveRes] = await Promise.all([
      fetch(`${baseUrl}/employees/directory`, { headers }).then(r => r.ok ? r.json() : { employees: [] }),
      fetch(`${baseUrl}/time_off/requests/?action=approve&status=requested`, { headers }).then(r => r.ok ? r.json() : []),
    ])

    const employees = directoryRes.employees || []
    const pendingLeave = Array.isArray(leaveRes) ? leaveRes : []
    const newStarters = employees.filter((e: any) => e.hireDate && e.hireDate >= monthStart)
    const leavers = employees.filter((e: any) => e.status === 'Inactive' && e.terminationDate && e.terminationDate >= monthStart)

    return NextResponse.json({
      connected: true, provider: 'bamboohr',
      headcount: employees.length,
      pendingLeave: pendingLeave.length,
      newStarters: newStarters.length,
      leavers: leavers.length,
      offSick: 0,
    })
  } catch (err) {
    console.error('[bamboohr/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch BambooHR data', connected: true }, { status: 502 })
  }
}
