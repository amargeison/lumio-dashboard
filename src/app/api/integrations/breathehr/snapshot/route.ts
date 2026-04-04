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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'breathehr').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Breathe HR not connected', connected: false }, { status: 404 })

  const apiKey = creds.access_token
  const baseUrl = 'https://api.breathehr.com/v1'
  const headers = { Accept: 'application/json', 'X-API-KEY': apiKey }

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [employeesRes, leaveRes, sicknessRes] = await Promise.all([
      fetch(`${baseUrl}/employees`, { headers }).then(r => r.ok ? r.json() : { employees: [] }),
      fetch(`${baseUrl}/absences?status=pending`, { headers }).then(r => r.ok ? r.json() : { absences: [] }),
      fetch(`${baseUrl}/sicknesses?start_date=${now.toISOString().split('T')[0]}`, { headers }).then(r => r.ok ? r.json() : { sicknesses: [] }),
    ])

    const employees = employeesRes.employees || []
    const pendingLeave = leaveRes.absences || []
    const sickness = sicknessRes.sicknesses || []
    const newStarters = employees.filter((e: any) => e.start_date && e.start_date >= monthStart)

    return NextResponse.json({
      connected: true, provider: 'breathehr',
      headcount: employees.length,
      pendingLeave: pendingLeave.length,
      newStarters: newStarters.length,
      leavers: 0,
      offSick: sickness.length,
    })
  } catch (err) {
    console.error('[breathehr/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Breathe HR data', connected: true }, { status: 502 })
  }
}
