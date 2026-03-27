import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const STATUS_MAP: Record<string, string> = {
  active: 'active',
  on_leave: 'holiday',
  probation: 'active',
  sick: 'sick',
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')

  if (token) {
    try {
      const supabase = getSupabase()
      const { data: session } = await supabase
        .from('business_sessions')
        .select('business_id')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (session) {
        const { data: rows } = await supabase
          .from('business_employees')
          .select('*')
          .eq('business_id', session.business_id)
          .order('start_date', { ascending: true })

        if (rows && rows.length > 0) {
          const team = rows.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            department: e.department,
            avatar: e.avatar ?? e.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
            status: STATUS_MAP[e.status] ?? 'active',
            openTasks: 0,
            alerts: 0,
          }))
          return NextResponse.json({ team })
        }
      }
    } catch { /* fall through */ }
  }

  // Fallback: hardcoded team
  return NextResponse.json({
    team: [
      { id: '1', name: 'Sarah Mitchell', role: 'Head of HR', department: 'HR', avatar: 'SM', status: 'active', todayFocus: 'New joiner × 2', openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago' },
      { id: '2', name: 'Oliver Bennett', role: 'Head of Sales', department: 'Sales', avatar: 'OB', status: 'active', todayFocus: 'Demo calls × 2', openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads' },
      { id: '3', name: 'Charlotte Davies', role: 'Senior AE', department: 'Sales', avatar: 'CD', status: 'wfh', todayFocus: 'Oakridge demo', openTasks: 4, alerts: 0 },
      { id: '4', name: 'George Harrison', role: 'Head of Finance', department: 'Finance', avatar: 'GH', status: 'active', todayFocus: 'Invoice review', openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3' },
      { id: '5', name: 'Alexander Jones', role: 'Head of IT', department: 'IT', avatar: 'AJ', status: 'active', openTasks: 2, alerts: 0, recentActivity: 'IT-01 complete' },
      { id: '6', name: 'Sophia Brown', role: 'Head of Marketing', department: 'Marketing', avatar: 'SB', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday' },
    ],
  })
}
