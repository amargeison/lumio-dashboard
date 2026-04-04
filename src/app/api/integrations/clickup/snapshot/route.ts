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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'clickup').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'ClickUp not connected', connected: false }, { status: 404 })

  const baseUrl = 'https://api.clickup.com/api/v2'
  const headers = { Authorization: `Bearer ${creds.access_token}`, 'Content-Type': 'application/json' }

  try {
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]

    // Get teams (workspaces) first
    const teamsRes = await fetch(`${baseUrl}/team`, { headers }).then(r => r.ok ? r.json() : { teams: [] })
    const teams = teamsRes.teams || []

    let totalSpaces = 0
    let openTasks = 0
    let overdueTasks = 0
    let dueToday = 0

    for (const team of teams) {
      const spacesRes = await fetch(`${baseUrl}/team/${team.id}/space?archived=false`, { headers }).then(r => r.ok ? r.json() : { spaces: [] })
      const spaces = spacesRes.spaces || []
      totalSpaces += spaces.length

      // Get tasks filtered to open statuses
      const tasksRes = await fetch(`${baseUrl}/team/${team.id}/task?subtasks=true&include_closed=false&page=0`, { headers }).then(r => r.ok ? r.json() : { tasks: [] })
      const tasks = Array.isArray(tasksRes.tasks) ? tasksRes.tasks : []

      openTasks += tasks.length
      for (const task of tasks) {
        if (task.due_date) {
          const dueDate = new Date(Number(task.due_date)).toISOString().split('T')[0]
          if (dueDate < today) overdueTasks++
          if (dueDate === today) dueToday++
        }
      }
    }

    return NextResponse.json({
      connected: true, provider: 'clickup',
      open_tasks: openTasks,
      overdue_tasks: overdueTasks,
      spaces: totalSpaces,
      due_today: dueToday,
    })
  } catch (err) {
    console.error('[clickup/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch ClickUp data', connected: true }, { status: 502 })
  }
}
